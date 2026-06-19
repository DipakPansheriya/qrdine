import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MenuFacade } from '../../../../core/facades/menu.facade';
import { AuthFacade } from '../../../../core/facades/auth.facade';
import { MenuCategoryRepository } from '../../../../core/repositories/menu-category.repository';
import { MenuCategory } from '../../../../core/models';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatDialogModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private facade = inject(MenuFacade);
  private authFacade = inject(AuthFacade);
  private repo = inject(MenuCategoryRepository);
  private dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  private data = inject(MAT_DIALOG_DATA, { optional: true });

  isEditMode = false;
  categoryId: string | null = null;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    status: ['active', Validators.required]
  });

  ngOnInit() {
    if (this.data && this.data.categoryId) {
      this.isEditMode = true;
      this.categoryId = this.data.categoryId;
      
      this.repo.getById(this.categoryId!).subscribe(category => {
        if (category) {
          this.form.patchValue(category);
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const user = this.authFacade.currentUser();

    if (!user || !user.restaurantId) {
      alert('Error: No restaurant associated with this account.');
      return;
    }

    if (this.isEditMode && this.categoryId) {
      this.facade.updateCategory(this.categoryId, formValue).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      const newCategory: MenuCategory = {
        categoryId: 'cat_' + Date.now(), // Real app would use Firestore auto-ID or generate UUID
        restaurantId: user.restaurantId,
        ...formValue
      };
      
      this.facade.createCategory(newCategory).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
