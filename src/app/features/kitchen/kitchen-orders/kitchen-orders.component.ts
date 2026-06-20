import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { KitchenFacade } from '../../../core/facades/kitchen.facade';
import { Order } from '../../../core/models';

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
  styleUrls: ['./kitchen-orders.component.scss']
})
export class KitchenOrdersComponent implements OnInit, OnDestroy {
  kitchenFacade = inject(KitchenFacade);
  
  // Timer state
  currentTime = new Date();
  private timerInt: any;

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

  toggleItemStatus(order: Order, index: number, event: any) {
    const status = event.checked ? 'Ready' : 'Pending';
    this.kitchenFacade.updateItemStatus(order, index, status);
  }
}
