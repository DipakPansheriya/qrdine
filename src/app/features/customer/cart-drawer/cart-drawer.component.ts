import { Component, inject, signal, OnInit, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
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
export class CartDrawerComponent implements OnInit {
  public facade = inject(CustomerFacade);
  private dialogRef = inject(MatDialogRef<CartDrawerComponent>);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  orderNotes = signal<string>('');
  customerName = signal<string>('');

  ngOnInit() {
    this.customerName.set(localStorage.getItem('qrdine_customer_name') || '');

    let parent = this.elementRef.nativeElement.parentElement;
    while (parent && !parent.classList.contains('cdk-overlay-pane')) {
      parent = parent.parentElement;
    }
    if (parent) {
      const vars = this.facade.styleVariables();
      Object.keys(vars).forEach(key => {
        this.renderer.setStyle(parent, key, vars[key]);
      });
    }
  }

  close() {
    this.dialogRef.close();
  }

  updateQuantity(index: number, delta: number) {
    this.facade.updateQuantity(index, delta);
    if (this.facade.cartItemCount() === 0) {
      this.close();
    }
  }

  async checkout() {
    try {
      const name = this.customerName().trim();
      const requireName = this.facade.experience()?.requireCustomerName ?? true;
      if (requireName && !name) {
        alert('Please enter your name to place the order.');
        return;
      }
      
      if (name) {
        localStorage.setItem('qrdine_customer_name', name);
      }

      const orderId = await this.facade.placeOrder(this.orderNotes(), name);
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
