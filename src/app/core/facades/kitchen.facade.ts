import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthFacade } from './auth.facade';
import { OrderRepository } from '../repositories/order.repository';
import { Order, CartItem } from '../models';
import { Subscription, firstValueFrom } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';
import { calculateOrderStatus } from '../utils/order.utils';

@Injectable({ providedIn: 'root' })
export class KitchenFacade {
  private authFacade = inject(AuthFacade);
  private orderRepo = inject(OrderRepository);

  loading = signal(true);
  kitchenOrders = signal<Order[]>([]);
  private orderSub: Subscription | null = null;
  private lastOrderCount = 0;
  
  // Using an empty/generic beep if assets/notification.mp3 doesn't exist, we fallback to catching the error.
  private notificationAudio = new Audio('assets/notification.mp3');

  // Computed lists for Kanban (Combine Pending and Accepted into 'Pending' column)
  pendingOrders = computed(() => this.kitchenOrders().filter(o => o.status === 'Pending' || o.status === 'Accepted'));
  preparingOrders = computed(() => this.kitchenOrders().filter(o => o.status === 'Preparing'));
  readyOrders = computed(() => this.kitchenOrders().filter(o => o.status === 'Ready'));

  // KPIs
  kpis = computed(() => {
    const orders = this.kitchenOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return ts >= today;
    });

    const pendingCount = this.pendingOrders().length;
    const readyCount = this.readyOrders().length;

    let totalPrepTimeMs = 0;
    let preppedCount = 0;
    
    todayOrders.forEach(o => {
      if (o.status === 'Ready' || o.status === 'Delivered' || o.status === 'Completed') {
        const createTs = o.createdAt?.toDate ? o.createdAt.toDate().getTime() : new Date(o.createdAt).getTime();
        const updateTs = o.updatedAt?.toDate ? o.updatedAt.toDate().getTime() : new Date(o.updatedAt).getTime();
        totalPrepTimeMs += (updateTs - createTs);
        preppedCount++;
      }
    });

    const avgPrepTimeMins = preppedCount > 0 ? Math.round(totalPrepTimeMs / preppedCount / 60000) : 0;

    return {
      ordersToday: todayOrders.length,
      pendingOrders: pendingCount,
      readyOrders: readyCount,
      avgPrepTime: avgPrepTimeMins
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
      const orders = this.kitchenOrders();
      if (!this.loading()) {
        const pending = this.pendingOrders();
        if (pending.length > this.lastOrderCount) {
          this.playNotification();
        }
        this.lastOrderCount = pending.length;
      }
    });
  }

  private loadAll(restaurantId: string) {
    this.loading.set(true);
    if (this.orderSub) this.orderSub.unsubscribe();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.orderSub = this.orderRepo.getByRestaurant(restaurantId).subscribe({
      next: (orders) => {
        const kitchenActive = orders.filter(o => {
          const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          const isToday = ts >= today;
          const isActiveStatus = ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status);
          return isToday || isActiveStatus;
        });
        
        kitchenActive.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return tA - tB;
        });

        this.kitchenOrders.set(kitchenActive);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const order = this.kitchenOrders().find(o => o.orderId === orderId);
      let updatedItems = order ? [...order.items] : [];

      if (order && (status === 'Preparing' || status === 'Ready')) {
        updatedItems = order.items.map(item => {
          let ks = item.kitchenStatus || 'Pending';
          let prepTime = item.preparedAt;

          if (status === 'Preparing' && ks === 'Pending') {
            ks = 'Preparing';
          } else if (status === 'Ready' && ks !== 'Ready') {
            ks = 'Ready';
            prepTime = new Date() as any;
          }
          
          const newItem = {
            ...item,
            kitchenStatus: ks,
            preparedAt: prepTime
          };
          
          // Remove undefined values
          Object.keys(newItem).forEach(k => {
            if ((newItem as any)[k] === undefined) {
              delete (newItem as any)[k];
            }
          });
          
          return newItem;
        });
      }

      await firstValueFrom(this.orderRepo.update(orderId, { 
        status, 
        ...(order ? { items: updatedItems } : {}),
        updatedAt: serverTimestamp() 
      }));
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }

  async updateItemStatus(order: Order, itemIndex: number, kitchenStatus: 'Pending' | 'Preparing' | 'Ready') {
    try {
      const updatedItems = [...order.items];
      const updatedItem = { 
        ...updatedItems[itemIndex], 
        kitchenStatus
      };
      
      if (kitchenStatus === 'Ready') {
        updatedItem.preparedAt = new Date() as any;
      }
      
      // Remove undefined values
      Object.keys(updatedItem).forEach(k => {
        if ((updatedItem as any)[k] === undefined) {
          delete (updatedItem as any)[k];
        }
      });
      
      updatedItems[itemIndex] = updatedItem;
      
      const newOrderStatus = calculateOrderStatus(updatedItems);

      await firstValueFrom(this.orderRepo.update(order.orderId, { 
        items: updatedItems, 
        status: newOrderStatus,
        updatedAt: serverTimestamp() 
      }));
    } catch (err) {
      console.error('Failed to update item status:', err);
    }
  }

  private playNotification() {
    this.notificationAudio.play().catch(e => console.warn('Browser blocked audio playback', e));
  }
}
