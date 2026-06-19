import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { CustomerFacade } from '../../../core/facades/customer.facade';
import { Subscription } from 'rxjs';
import { CartDrawerComponent } from '../cart-drawer/cart-drawer.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule, 
    MatIconModule, 
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatBottomSheetModule
  ],
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.component.scss'],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  public facade = inject(CustomerFacade);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);
  private sub = new Subscription();

  isError = signal<boolean>(false);

  ngOnInit() {
    this.sub.add(
      this.route.paramMap.subscribe(params => {
        const restaurantId = params.get('restaurantId');
        const tableId = params.get('tableId');
        
        if (restaurantId && tableId) {
          this.facade.initializeSession(restaurantId, tableId).catch(err => {
            this.isError.set(true);
          });
        }
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  openCart() {
    if (this.facade.cartItemCount() === 0) return;
    this.bottomSheet.open(CartDrawerComponent, {
      panelClass: 'cart-bottom-sheet'
    });
  }
}
