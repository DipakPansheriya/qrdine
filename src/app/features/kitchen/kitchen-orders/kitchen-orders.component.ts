import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { KitchenFacade } from '../../../core/facades/kitchen.facade';
import { Order } from '../../../core/models';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-kitchen-orders',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule
  ],
  templateUrl: './kitchen-orders.component.html',
  styleUrls: ['./kitchen-orders.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class KitchenOrdersComponent implements OnInit, OnDestroy {
  kitchenFacade = inject(KitchenFacade);
  
  // Timer state
  currentTime = new Date();
  private timerInt: any;
  private previousPendingCount = 0;

  constructor() {
    effect(() => {
      const currentCount = this.kitchenFacade.pendingOrders().length;
      if (currentCount > this.previousPendingCount) {
        this.playSound();
      }
      this.previousPendingCount = currentCount;
    });
  }

  ngOnInit() {
    this.timerInt = setInterval(() => {
      this.currentTime = new Date();
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
    return Math.floor((this.currentTime.getTime() - start) / 60000);
  }

  getTimerClass(createdAt: any): string {
    const mins = this.getElapsedMinutes(createdAt);
    if (mins >= 20) return 'timer-critical';
    if (mins >= 10) return 'timer-warning';
    return 'timer-normal';
  }

  setItemStatus(order: Order, index: number, status: 'Pending' | 'Preparing' | 'Ready', event: Event) {
    event.stopPropagation();
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
