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
}
