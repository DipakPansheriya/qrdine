import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { WaiterFacade } from '../../../core/facades/waiter.facade';
import { PartialDeliverySheetComponent } from '../partial-delivery-sheet/partial-delivery-sheet.component';

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatRippleModule,
    MatBottomSheetModule
  ],
  templateUrl: './waiter-dashboard.component.html',
  styleUrls: ['./waiter-dashboard.component.scss']
})
export class WaiterDashboardComponent {
  waiterFacade = inject(WaiterFacade);
  bottomSheet = inject(MatBottomSheet);
  
  activeTab = signal<'ready' | 'requests' | 'bills' | 'tables'>('ready');

  now = new Date();
  
  constructor() {
    setInterval(() => this.now = new Date(), 60000);
  }

  setTab(tab: 'ready' | 'requests' | 'bills' | 'tables') {
    this.activeTab.set(tab);
  }

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

  deliverOrder(orderId: string, itemIndexes: number[]) {
    const order = this.waiterFacade.allOrders().find(o => o.orderId === orderId);
    if (!order) return;

    const readyItemsData = itemIndexes.map(idx => {
      const item = order.items[idx];
      return { ...item, originalIndex: idx };
    });

    if (readyItemsData.length > 1) {
      // Open partial delivery sheet
      const sheetRef = this.bottomSheet.open(PartialDeliverySheetComponent, {
        data: { orderId, readyItems: readyItemsData }
      });

      sheetRef.afterDismissed().subscribe(selectedIndexes => {
        if (selectedIndexes && selectedIndexes.length > 0) {
          this.waiterFacade.deliverItems(orderId, selectedIndexes);
        }
      });
    } else {
      // Single item, deliver immediately
      this.waiterFacade.deliverItems(orderId, itemIndexes);
    }
  }

  getReadyItemNames(orderId: string, itemIndexes: number[]): string[] {
    const order = this.waiterFacade.allOrders().find(o => o.orderId === orderId);
    if (!order) return [];
    return itemIndexes.map(idx => order.items[idx].name);
  }
}
