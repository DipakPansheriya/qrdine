import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MenuItem, CartItem } from '../../../core/models';

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
export class ModifierDialogComponent {
  quantity = signal<number>(1);
  notes = signal<string>('');

  constructor(
    public dialogRef: MatDialogRef<ModifierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: MenuItem }
  ) {}

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
