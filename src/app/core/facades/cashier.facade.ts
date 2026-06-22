import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthFacade } from './auth.facade';
import { TableRepository } from '../repositories/table.repository';
import { CustomerSessionRepository } from '../repositories/customer-session.repository';
import { OrderRepository } from '../repositories/order.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { OwnerSettingsFacade } from './owner-settings.facade';
import { BillingCalculationService } from '../services/billing.service';
import { Table, CustomerSession, Order, Payment } from '../models';
import { Subscription, firstValueFrom } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';
import { NotificationFacade } from './notification.facade';

@Injectable({ providedIn: 'root' })
export class CashierFacade {
  private authFacade = inject(AuthFacade);
  private tableRepo = inject(TableRepository);
  private sessionRepo = inject(CustomerSessionRepository);
  private orderRepo = inject(OrderRepository);
  private paymentRepo = inject(PaymentRepository);
  public settingsFacade = inject(OwnerSettingsFacade);
  private billingService = inject(BillingCalculationService);
  private notificationFacade = inject(NotificationFacade);

  loading = signal(true);

  tables = signal<Table[]>([]);
  sessions = signal<CustomerSession[]>([]);
  allOrders = signal<Order[]>([]);
  payments = signal<Payment[]>([]);

  private sub1: Subscription | null = null;
  private sub2: Subscription | null = null;
  private sub3: Subscription | null = null;
  private sub4: Subscription | null = null;

  activeBills = computed(() => {
    return this.tables().filter(t => t.status === 'OCCUPIED' && t.activeSessionId);
  });

  kpis = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = this.payments().filter(p => {
      const ts = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      return ts >= today;
    });

    const revenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const completedCount = todayPayments.length;
    const avgBill = completedCount > 0 ? revenue / completedCount : 0;

    return {
      todayRevenue: revenue,
      completedOrders: completedCount,
      averageBill: avgBill
    };
  });

  constructor() {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.loadAll(user.restaurantId);
      }
    }, { allowSignalWrites: true });
  }

  private loadAll(restaurantId: string) {
    this.loading.set(true);
    
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
    if (this.sub4) this.sub4.unsubscribe();

    this.sub1 = this.tableRepo.getByRestaurant(restaurantId).subscribe(data => {
      this.tables.set(data.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, {numeric: true})));
    });
    this.sub2 = this.sessionRepo.getByRestaurant(restaurantId).subscribe(data => this.sessions.set(data));
    
    this.sub3 = this.orderRepo.getByRestaurant(restaurantId).subscribe(data => {
      this.allOrders.set(data.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded'));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.sub4 = this.paymentRepo.getByRestaurant(restaurantId).subscribe(data => {
       const todayData = data.filter(p => {
          const ts = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          return ts >= today;
       });
       this.payments.set(todayData);
       this.loading.set(false);
    });
  }

  generateBill(sessionId: string) {
    const orders = this.allOrders().filter(o => o.sessionId === sessionId);
    const settings = this.settingsFacade.settings();
    return this.billingService.calculateSessionSummary(orders, settings);
  }

  async updateBillStatus(sessionId: string, status: 'Requested' | 'Generating' | 'Ready' | 'Paid' | 'Closed') {
    await firstValueFrom(this.sessionRepo.update(sessionId, { billStatus: status }));
  }

  async processPayment(tableId: string, sessionId: string, amount: number, method: Payment['method']) {
    try {
      const user = this.authFacade.currentUser();
      if (!user?.restaurantId) throw new Error('No user context');

      const paymentData: Omit<Payment, 'paymentId'> = {
        restaurantId: user.restaurantId,
        sessionId,
        amount,
        method,
        status: 'SUCCESS',
        createdAt: serverTimestamp()
      };
      await firstValueFrom(this.paymentRepo.create(paymentData as any));

      const orders = this.allOrders().filter(o => o.sessionId === sessionId);
      for (const o of orders) {
        if (o.status !== 'Completed') {
          await firstValueFrom(this.orderRepo.update(o.orderId, { 
            status: 'Completed', 
            paymentStatus: 'PAID',
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp() 
          }));
        } else {
          // If already completed but not paid (shouldn't happen often, but just in case)
          if (o.paymentStatus !== 'PAID') {
            await firstValueFrom(this.orderRepo.update(o.orderId, { 
              paymentStatus: 'PAID',
              paidAt: serverTimestamp(),
              updatedAt: serverTimestamp() 
            }));
          }
        }
      }

      await firstValueFrom(this.sessionRepo.update(sessionId, { status: 'Completed', billStatus: 'Paid', endTime: serverTimestamp() }));
      await firstValueFrom(this.tableRepo.update(tableId, { status: 'AVAILABLE', activeSessionId: '' }));

      // Notify Customer
      await this.notificationFacade.sendNotification({
        targetRole: 'Customer', targetUserId: sessionId,
        type: 'PAYMENT_SUCCESS', title: 'Payment Successful',
        message: `Your payment of ₹${amount} was successfully processed. Thank you!`,
        priority: 'MEDIUM', entityId: sessionId, entityType: 'session'
      });

    } catch (err) {
      console.error('Failed to process payment:', err);
      throw err;
    }
  }
}
