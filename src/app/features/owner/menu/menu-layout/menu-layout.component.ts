import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryListComponent } from '../category-list/category-list.component';
import { ItemListComponent } from '../item-list/item-list.component';
import { MenuFacade } from '../../../../core/facades/menu.facade';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { ItemFormComponent } from '../item-form/item-form.component';

@Component({
  selector: 'app-menu-layout',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CategoryListComponent, ItemListComponent, MatDialogModule],
  templateUrl: './menu-layout.component.html',
  styleUrl: './menu-layout.component.scss'
})
export class MenuLayoutComponent implements OnInit {
  private facade = inject(MenuFacade);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.facade.loadMenuData();
  }

  openCategoryForm() {
    this.dialog.open(CategoryFormComponent, { width: '400px' });
  }

  openItemForm() {
    const categoryId = this.facade.selectedCategoryId();
    if (!categoryId) {
      alert('Please select or create a category first.');
      return;
    }
    this.dialog.open(ItemFormComponent, { 
      width: '600px',
      data: { categoryId }
    });
  }
}
