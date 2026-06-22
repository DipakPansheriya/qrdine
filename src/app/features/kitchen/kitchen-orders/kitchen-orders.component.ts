import { Component, inject, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { KitchenFacade } from '../../../core/facades/kitchen.facade';
import { Order } from '../../../core/models';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationDrawerComponent } from '../../../shared/components/notification-drawer/notification-drawer.component';
import { NotificationFacade } from '../../../core/facades/notification.facade';

@Component({
  selector: 'app-kitchen-orders',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    NotificationDrawerComponent
  ],
  templateUrl: './kitchen-orders.component.html',
  styleUrls: ['./kitchen-orders.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class KitchenOrdersComponent implements OnInit, OnDestroy {
  public kitchenFacade = inject(KitchenFacade);
  public notifFacade = inject(NotificationFacade);
  
  isDrawerOpen = false;
  activeTab = signal<'Pending' | 'Preparing' | 'Ready'>('Pending');
  activeItemKey = signal<string | null>(null); // orderId_itemIndex format
  
  // Timer state
  currentTime = signal(new Date());
  private timerInt: any;
  private previousPendingCount = 0;
  private notifiedUrgentOrders = new Set<string>();

  constructor() {
    effect(() => {
      const currentCount = this.kitchenFacade.pendingOrders().length;
      if (currentCount > this.previousPendingCount) {
        this.playSound();
      }
      this.previousPendingCount = currentCount;
    });

    // Urgency audio check based on timer tick
    effect(() => {
      const tick = this.currentTime();
      const allOrders = this.kitchenFacade.kitchenOrders();
      allOrders.forEach(o => {
        if (o.status !== 'Ready' && o.status !== 'Delivered') {
          const mins = this.getElapsedMinutes(o.createdAt);
          if (mins >= 10 && !this.notifiedUrgentOrders.has(o.orderId)) {
            this.notifiedUrgentOrders.add(o.orderId);
            this.playSound(); // Play sound for newly urgent order
          }
        }
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.timerInt = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000); // Update every minute
  }

  ngOnDestroy() {
    if (this.timerInt) {
      clearInterval(this.timerInt);
    }
  }

  playSound() {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.play().catch(e => console.log('Audio play failed, likely due to browser policy without interaction', e));
  }

  setTab(tab: 'Pending' | 'Preparing' | 'Ready') {
    this.activeTab.set(tab);
  }

  toggleItemAction(orderId: string, index: number, event: Event) {
    event.stopPropagation();
    const key = `${orderId}_${index}`;
    if (this.activeItemKey() === key) {
      this.activeItemKey.set(null);
    } else {
      this.activeItemKey.set(key);
    }
  }

  isItemActionActive(orderId: string, index: number): boolean {
    return this.activeItemKey() === `${orderId}_${index}`;
  }

  drop(event: CdkDragDrop<Order[]>) {
    if (event.previousContainer !== event.container) {
      const order = event.previousContainer.data[event.previousIndex];
      let newStatus: Order['status'] = 'Pending';
      if (event.container.id === 'pendingList') newStatus = 'Pending';
      if (event.container.id === 'preparingList') newStatus = 'Preparing';
      if (event.container.id === 'readyList') newStatus = 'Ready';
      
      this.kitchenFacade.updateOrderStatus(order.orderId, newStatus);
    }
  }

  getElapsedMinutes(createdAt: any): number {
    const start = createdAt?.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime();
    return Math.floor((this.currentTime().getTime() - start) / 60000);
  }

  getTimerClass(createdAt: any): string {
    const mins = this.getElapsedMinutes(createdAt);
    if (mins >= 10) return 'timer-critical'; // Urgent
    if (mins >= 5) return 'timer-warning';  // Warning
    return 'timer-normal';                  // Normal
  }

  setItemStatus(order: Order, index: number, status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered', event: Event) {
    event.stopPropagation();
    this.activeItemKey.set(null); // Close action bar
    this.kitchenFacade.updateItemStatus(order, index, status);
  }

  getCompletedCount(order: Order): number {
    return order.items.filter(i => i.kitchenStatus === 'Ready' || i.deliveryStatus === 'Delivered').length;
  }

  getProgressPercentage(order: Order): number {
    if (!order.items || order.items.length === 0) return 0;
    return (this.getCompletedCount(order) / order.items.length) * 100;
  }
}

