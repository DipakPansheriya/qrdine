import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuFacade } from '../../../../core/facades/menu.facade';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ItemFormComponent } from '../item-form/item-form.component';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss'
})
export class ItemListComponent {
  private facade = inject(MenuFacade);
  private dialog = inject(MatDialog);

  items = this.facade.selectedCategoryItems;
  selectedCategoryId = this.facade.selectedCategoryId;

  editItem(id: string) {
    this.dialog.open(ItemFormComponent, {
      width: '600px',
      data: { itemId: id, categoryId: this.selectedCategoryId() }
    });
  }

  deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this menu item?')) {
      this.facade.deleteItem(id).subscribe();
    }
  }
}
