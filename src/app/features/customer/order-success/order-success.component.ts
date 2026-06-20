import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderRepository } from '../../../core/repositories/order.repository';
import { CustomerFacade } from '../../../core/facades/customer.facade';
import { Order } from '../../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './order-success.component.html',
  styleUrls: ['./order-success.component.scss']
})
export class OrderSuccessComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private orderRepo = inject(OrderRepository);
  public facade = inject(CustomerFacade);

  order = signal<Order | null>(null);
  loading = signal<boolean>(true);
  
  private sub = new Subscription();

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.sub.add(
        this.orderRepo.getById(orderId).subscribe(ord => {
          this.order.set(ord || null);
          this.loading.set(false);
        })
      );
    } else {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Pending': return 'Waiting for confirmation...';
      case 'Accepted': return 'Order accepted!';
      case 'Preparing': return 'Kitchen is preparing your food.';
      case 'Partially Ready': return 'Some items are ready.';
      case 'Partially Delivered': return 'Some items have been delivered.';
      case 'Ready': return 'Your order is ready to be served!';
      case 'Delivered': return 'Enjoy your meal!';
      case 'Completed': return 'Order completed.';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending': return 'schedule';
      case 'Accepted': return 'thumb_up';
      case 'Preparing': return 'soup_kitchen';
      case 'Partially Ready': return 'room_service';
      case 'Partially Delivered': return 'restaurant';
      case 'Ready': return 'room_service';
      case 'Delivered': return 'restaurant';
      case 'Completed': return 'check_circle';
      default: return 'info';
    }
  }

  getActiveStepIndex(status?: string): number {
    if (!status) return 1;
    if (['Pending', 'Accepted'].includes(status)) return 1;
    if (['Preparing', 'Partially Ready'].includes(status)) return 2;
    return 3;
  }

  getStepProgressPercent(status?: string): number {
    if (!status) return 33;
    if (['Pending', 'Accepted'].includes(status)) return 33;
    if (['Preparing', 'Partially Ready'].includes(status)) return 66;
    return 100;
  }
}
