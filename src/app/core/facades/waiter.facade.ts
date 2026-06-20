import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthFacade } from './auth.facade';
import { TableRepository } from '../repositories/table.repository';
import { CustomerRequestRepository } from '../repositories/customer-request.repository';
import { OrderRepository } from '../repositories/order.repository';
import { CustomerSessionRepository } from '../repositories/customer-session.repository';
import { Table, CustomerRequest, Order, CustomerSession } from '../models';
import { Subscription, firstValueFrom } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class WaiterFacade {
  private authFacade = inject(AuthFacade);
  private tableRepo = inject(TableRepository);
  private requestRepo = inject(CustomerRequestRepository);
  private orderRepo = inject(OrderRepository);
  private sessionRepo = inject(CustomerSessionRepository);

  loading = signal(true);
  
  tables = signal<Table[]>([]);
  allRequests = signal<CustomerRequest[]>([]);
  allOrders = signal<Order[]>([]);
  activeSessions = signal<CustomerSession[]>([]);
  
  private tableSub: Subscription | null = null;
  private reqSub: Subscription | null = null;
  private orderSub: Subscription | null = null;
  private sessionSub: Subscription | null = null;

  private lastRequestCount = 0;
  private lastReadyOrderCount = 0;
  private lastBillRequestCount = 0;
  private notificationAudio = new Audio('assets/notification.mp3');

  activeRequests = computed(() => {
    const requests = this.allRequests().filter(r => r.status === 'Pending');
    return requests.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return tA - tB; // oldest first
    });
  });

  readyOrders = computed(() => {
    const orders = this.allOrders().filter(o => o.status === 'Ready');
    return orders.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return tA - tB; // oldest first
    });
  });

  activeBillRequests = computed(() => {
    return this.activeSessions().filter(s => s.billStatus === 'Requested' || s.billStatus === 'Ready');
  });

  kpis = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRequests = this.allRequests().filter(r => {
      const ts = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return ts >= today;
    });

    const todayOrders = this.allOrders().filter(o => {
      const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return ts >= today;
    });

    const deliveredOrders = todayOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed');
    const tablesServedCount = new Set(deliveredOrders.map(o => o.tableId)).size;

    let totalResponseMs = 0;
    let resolvedCount = 0;

    todayRequests.forEach(r => {
      if (r.status === 'Resolved' && r.resolvedAt) {
        const createTs = r.createdAt?.toDate ? r.createdAt.toDate().getTime() : new Date(r.createdAt).getTime();
        const resolveTs = r.resolvedAt?.toDate ? r.resolvedAt.toDate().getTime() : new Date(r.resolvedAt).getTime();
        totalResponseMs += (resolveTs - createTs);
        resolvedCount++;
      }
    });

    const avgResponseMins = resolvedCount > 0 ? Math.round(totalResponseMs / resolvedCount / 60000) : 0;

    return {
      tablesServed: tablesServedCount,
      ordersDelivered: deliveredOrders.length,
      avgResponseTime: avgResponseMins
    };
  });

  constructor() {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.loadAll(user.restaurantId);
      }
    }, { allowSignalWrites: true });
    
    // Notification logic
    effect(() => {
      if (!this.loading()) {
        const requests = this.activeRequests();
        const ready = this.readyOrders();
        const billReqs = this.activeBillRequests();
        
        let play = false;
        if (requests.length > this.lastRequestCount) play = true;
        if (ready.length > this.lastReadyOrderCount) play = true;
        if (billReqs.length > this.lastBillRequestCount) play = true;
        
        if (play) this.playNotification();
        
        this.lastRequestCount = requests.length;
        this.lastReadyOrderCount = ready.length;
        this.lastBillRequestCount = billReqs.length;
      }
    });
  }

  private loadAll(restaurantId: string) {
    this.loading.set(true);
    if (this.tableSub) this.tableSub.unsubscribe();
    if (this.reqSub) this.reqSub.unsubscribe();
    if (this.orderSub) this.orderSub.unsubscribe();
    if (this.sessionSub) this.sessionSub.unsubscribe();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.tableSub = this.tableRepo.getByRestaurant(restaurantId).subscribe({
      next: (tables) => {
        this.tables.set(tables.sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, {numeric: true})));
      }
    });

    this.reqSub = this.requestRepo.getByRestaurant(restaurantId).subscribe({
      next: (reqs) => {
        const activeOrToday = reqs.filter(r => {
          const ts = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
          return ts >= today || r.status === 'Pending';
        });
        this.allRequests.set(activeOrToday);
      }
    });

    this.orderSub = this.orderRepo.getByRestaurant(restaurantId).subscribe({
      next: (orders) => {
        const activeOrToday = orders.filter(o => {
          const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return ts >= today || ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status);
        });
        this.allOrders.set(activeOrToday);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.sessionSub = this.sessionRepo.getByRestaurant(restaurantId).subscribe({
      next: (sessions) => {
        this.activeSessions.set(sessions.filter(s => s.status === 'Active'));
      }
    });
  }

  async resolveRequest(requestId: string) {
    try {
      await firstValueFrom(this.requestRepo.update(requestId, { 
        status: 'Resolved', 
        resolvedAt: serverTimestamp() 
      }));
    } catch (err) {
      console.error('Failed to resolve request:', err);
    }
  }

  async markOrderDelivered(orderId: string) {
    try {
      await firstValueFrom(this.orderRepo.update(orderId, { 
        status: 'Delivered', 
        updatedAt: serverTimestamp() 
      }));
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }

  private playNotification() {
    this.notificationAudio.play().catch(e => console.warn('Browser blocked audio playback', e));
  }
}
