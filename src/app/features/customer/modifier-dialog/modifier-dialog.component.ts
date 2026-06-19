import { Component, Inject, inject, signal, OnInit, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MenuItem, CartItem } from '../../../core/models';
import { CustomerFacade } from '../../../core/facades/customer.facade';

@Component({
  selector: 'app-modifier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './modifier-dialog.component.html',
  styleUrls: ['./modifier-dialog.component.scss']
})
export class ModifierDialogComponent implements OnInit {
  public facade = inject(CustomerFacade);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  quantity = signal<number>(1);
  notes = signal<string>('');

  constructor(
    public dialogRef: MatDialogRef<ModifierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: MenuItem }
  ) {}

  ngOnInit() {
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

  updateQuantity(delta: number) {
    const next = this.quantity() + delta;
    if (next > 0 && next < 50) {
      this.quantity.set(next);
    }
  }

  addToCart() {
    const item = this.data.item;
    // Base cart item structure
    const cartItem: CartItem = {
      itemId: item.itemId,
      name: item.name,
      price: item.price, // add modifier prices here later
      quantity: this.quantity(),
      modifiers: [], // Mocked for now
      notes: this.notes(),
      totalPrice: item.price * this.quantity() // basic multiplication
    };

    this.dialogRef.close(cartItem);
  }
}
