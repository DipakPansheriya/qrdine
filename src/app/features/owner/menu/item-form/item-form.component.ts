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
import { MenuItemRepository } from '../../../../core/repositories/menu-item.repository';
import { MenuItem } from '../../../../core/models';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatDialogModule],
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.scss'
})
export class ItemFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private facade = inject(MenuFacade);
  private authFacade = inject(AuthFacade);
  private repo = inject(MenuItemRepository);
  private dialogRef = inject(MatDialogRef<ItemFormComponent>);
  private data = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  itemId: string | null = null;
  categoryId: string = '';

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    image: [''],
    vegType: ['Veg', Validators.required],
    availability: ['Available', Validators.required],
    taxPercentage: [0, Validators.min(0)]
  });

  ngOnInit() {
    this.categoryId = this.data.categoryId;

    if (this.data.itemId) {
      this.isEditMode = true;
      this.itemId = this.data.itemId;
      
      this.repo.getById(this.itemId!).subscribe(item => {
        if (item) {
          this.form.patchValue(item);
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

    if (this.isEditMode && this.itemId) {
      const updateData: Partial<MenuItem> = {
        ...formValue,
        updatedAt: new Date().toISOString()
      };
      this.facade.updateItem(this.itemId, updateData).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      const newItem: MenuItem = {
        itemId: 'item_' + Date.now(),
        restaurantId: user.restaurantId,
        categoryId: this.categoryId,
        ...formValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.facade.createItem(newItem).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
