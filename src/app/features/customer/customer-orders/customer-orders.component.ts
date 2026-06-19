import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CustomerFacade } from '../../../core/facades/customer.facade';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.scss']
})
export class CustomerOrdersComponent {
  public facade = inject(CustomerFacade);

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
}
