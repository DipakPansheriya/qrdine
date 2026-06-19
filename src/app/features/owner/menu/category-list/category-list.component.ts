import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MenuFacade } from '../../../../core/facades/menu.facade';
import { MatDialog } from '@angular/material/dialog';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent {
  private facade = inject(MenuFacade);
  private dialog = inject(MatDialog);

  categories = this.facade.categories;
  selectedCategoryId = this.facade.selectedCategoryId;
  isLoading = this.facade.isLoading;

  selectCategory(id: string) {
    this.facade.selectCategory(id);
  }

  editCategory(id: string) {
    this.dialog.open(CategoryFormComponent, {
      width: '400px',
      data: { categoryId: id }
    });
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category? All items inside will be orphaned or deleted.')) {
      this.facade.deleteCategory(id).subscribe();
    }
  }
}
