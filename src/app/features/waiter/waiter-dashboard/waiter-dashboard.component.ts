import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { WaiterFacade } from '../../../core/facades/waiter.facade';

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatRippleModule
  ],
  templateUrl: './waiter-dashboard.component.html',
  styleUrls: ['./waiter-dashboard.component.scss']
})
export class WaiterDashboardComponent {
  waiterFacade = inject(WaiterFacade);

  getTableClass(status: string) {
    return {
      'status-available': status === 'AVAILABLE',
      'status-occupied': status === 'OCCUPIED',
      'status-reserved': status === 'RESERVED',
      'status-cleaning': status === 'CLEANING'
    };
  }

  getTableRequests(tableId: string) {
    return this.waiterFacade.activeRequests().filter(r => r.tableId === tableId);
  }

  getTableReadyOrders(tableId: string) {
    return this.waiterFacade.readyOrders().filter(o => o.tableId === tableId);
  }

  getTableBillRequest(tableId: string) {
    return this.waiterFacade.activeBillRequests().find(s => s.tableId === tableId);
  }

  getTableName(tableId: string): string {
    const table = this.waiterFacade.tables().find(t => t.id === tableId);
    return table ? table.tableNumber : tableId.substring(0, 3);
  }

  selectedDeliveryItems = new Set<string>();

  toggleDeliveryItem(orderId: string, itemIndex: number) {
    const key = `${orderId}-${itemIndex}`;
    if (this.selectedDeliveryItems.has(key)) {
      this.selectedDeliveryItems.delete(key);
    } else {
      this.selectedDeliveryItems.add(key);
    }
  }

  isDeliveryItemSelected(orderId: string, itemIndex: number) {
    return this.selectedDeliveryItems.has(`${orderId}-${itemIndex}`);
  }

  async deliverSelected() {
    // Group by orderId
    const orderMap = new Map<string, number[]>();
    this.selectedDeliveryItems.forEach(key => {
      const [orderId, idxStr] = key.split('-');
      if (!orderMap.has(orderId)) orderMap.set(orderId, []);
      orderMap.get(orderId)!.push(parseInt(idxStr, 10));
    });

    for (const [orderId, indexes] of orderMap.entries()) {
      await this.waiterFacade.deliverItems(orderId, indexes);
    }

    this.selectedDeliveryItems.clear();
  }
}
