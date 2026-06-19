import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CustomerFacade } from '../../../core/facades/customer.facade';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.scss']
})
export class CartDrawerComponent {
  public facade = inject(CustomerFacade);
  private bottomSheetRef = inject(MatBottomSheetRef<CartDrawerComponent>);
  private router = inject(Router);

  orderNotes = signal<string>('');

  close() {
    this.bottomSheetRef.dismiss();
  }

  updateQuantity(index: number, delta: number) {
    this.facade.updateQuantity(index, delta);
    if (this.facade.cartItemCount() === 0) {
      this.close();
    }
  }

  async checkout() {
    try {
      const orderId = await this.facade.placeOrder(this.orderNotes());
      this.close();
      
      const restId = this.facade.restaurant()?.restaurantId;
      const tblId = this.facade.table()?.id;
      
      if (restId && tblId) {
        this.router.navigate(['/menu', restId, tblId, 'success', orderId]);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to checkout');
    }
  }
}
