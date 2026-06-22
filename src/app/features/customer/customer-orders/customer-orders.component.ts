import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CustomerFacade } from '../../../core/facades/customer.facade';
import { Order } from '../../../core/models';
import { CurrencyService } from '../../../core/services/currency.service';
import { BillingCalculationService } from '../../../core/services/billing.service';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.scss']
})
export class CustomerOrdersComponent {
  public facade = inject(CustomerFacade);
  public currency = inject(CurrencyService);
  private billingService = inject(BillingCalculationService);

  sessionSummary = computed(() => {
    const orders = this.facade.orders();
    const settings = this.facade.settings();
    const summary = this.billingService.calculateSessionSummary(orders, settings);

    return {
      ordersCount: summary.ordersCount,
      totalAmount: summary.grandTotal,
      paidAmount: summary.paidAmount,
      pendingAmount: summary.pendingAmount
    };
  });

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return '#2196F3';
      case 'Accepted': return '#4CAF50';
      case 'Preparing': return '#FF9800';
      case 'Ready': return '#9C27B0';
      case 'Delivered': return '#4CAF50';
      case 'Completed': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      default: return '#757575';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending': return 'schedule';
      case 'Accepted': return 'thumb_up';
      case 'Preparing': return 'soup_kitchen';
      case 'Ready': return 'room_service';
      case 'Delivered': return 'check_circle';
      case 'Completed': return 'check_circle';
      case 'Cancelled': return 'cancel';
      default: return 'info';
    }
  }
  async requestWaiter() {
    await this.facade.requestAssistance();
    alert('Assistance requested. A waiter will be with you shortly.');
  }

  async requestWater() {
    // Usually there's a specific requestWater in facade or just a custom request type.
    // If not, we can simulate or just call requestAssistance. We'll use requestAssistance for now
    await this.facade.requestAssistance();
    alert('Water requested. A waiter will bring it shortly.');
  }

  async requestBill() {
    const status = this.facade.session()?.billStatus;
    if (!status || status === 'Paid') {
      await this.facade.requestBill();
    }
  }
}
