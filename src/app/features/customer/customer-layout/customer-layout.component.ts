import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetModule, MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
    MatBottomSheetModule,
    MatDialogModule
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
  private dialog = inject(MatDialog);
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
    this.dialog.open(CartDrawerComponent, {
      width: '90%',
      maxWidth: '500px',
      position: { top: '40px' },
      panelClass: 'cart-dialog-panel'
    });
  }

  async requestHelp() {
    await this.facade.requestAssistance();
    alert('Assistance requested. A waiter will be with you shortly.');
  }

  openProfile() {
    alert('Profile section coming soon!');
  }

  openServiceMenu() {
    this.bottomSheet.open(ServiceMenuSheetComponent, {
      panelClass: 'service-sheet-container'
    });
  }
}

@Component({
  selector: 'app-service-menu-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="service-sheet">
      <div class="sheet-header">
        <h3>Service Menu</h3>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="service-list">
        <button mat-flat-button class="service-btn" (click)="request('Request Water')">
          <mat-icon>water_drop</mat-icon> Request Water
        </button>
        <button mat-flat-button class="service-btn" (click)="request('Request Cutlery')">
          <mat-icon>restaurant</mat-icon> Request Cutlery
        </button>
        <button mat-flat-button class="service-btn" (click)="request('Call Waiter')">
          <mat-icon>person</mat-icon> Call Waiter
        </button>
        <button mat-flat-button class="service-btn" (click)="requestBill()" [disabled]="billRequested">
          <mat-icon>receipt</mat-icon> 
          <span *ngIf="!billRequested">Request Bill</span>
          <span *ngIf="billRequested">Bill Requested</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .service-sheet {
      padding: 24px;
      padding-bottom: 40px;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .sheet-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .service-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .service-btn {
      height: 56px;
      font-size: 1.1rem;
      border-radius: 16px;
      justify-content: flex-start;
      padding: 0 20px;
      background: var(--surface-ground);
      color: var(--text-primary);
      box-shadow: none;
    }
    .service-btn:not([disabled]):active {
      transform: scale(0.98);
    }
    .service-btn mat-icon {
      margin-right: 12px;
      color: var(--primary-color);
    }
    .service-btn[disabled] {
      opacity: 0.6;
    }
  `]
})
export class ServiceMenuSheetComponent {
  private facade = inject(CustomerFacade);
  private bottomSheetRef = inject(MatBottomSheetRef<ServiceMenuSheetComponent>);

  get billRequested() {
    const status = this.facade.session()?.billStatus;
    return !!status && status !== 'Paid';
  }

  close() {
    this.bottomSheetRef.dismiss();
  }

  async request(type: 'Request Water' | 'Request Cutlery' | 'Call Waiter') {
    await this.facade.requestAssistance(type);
    alert(`${type} requested.`);
    this.bottomSheetRef.dismiss();
  }

  async requestBill() {
    await this.facade.requestBill();
    alert('Bill requested.');
    this.bottomSheetRef.dismiss();
  }
}
