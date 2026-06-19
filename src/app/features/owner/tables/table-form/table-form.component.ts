import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TableFacade } from '../../../../core/facades/table.facade';
import { Table } from '../../../../core/models';

@Component({
  selector: 'app-table-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './table-form.component.html',
  styleUrls: ['./table-form.component.scss']
})
export class TableFormComponent implements OnInit {
  tableForm: FormGroup;
  isSubmitting = false;

  statuses = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'OCCUPIED', label: 'Occupied' },
    { value: 'RESERVED', label: 'Reserved' },
    { value: 'CLEANING', label: 'Cleaning' },
    { value: 'DISABLED', label: 'Disabled' }
  ];

  constructor(
    private fb: FormBuilder,
    private tableFacade: TableFacade,
    public dialogRef: MatDialogRef<TableFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isEditing: boolean; table?: Table }
  ) {
    this.tableForm = this.fb.group({
      tableNumber: ['', [Validators.required]],
      capacity: [4, [Validators.required, Validators.min(1)]],
      status: ['AVAILABLE', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.data.isEditing && this.data.table) {
      this.tableForm.patchValue({
        tableNumber: this.data.table.tableNumber,
        capacity: this.data.table.capacity,
        status: this.data.table.status
      });
    }
  }

  async onSubmit() {
    if (this.tableForm.invalid) return;

    this.isSubmitting = true;
    const formValue = this.tableForm.value;

    try {
      // Basic check for unique tableNumber could be added here by checking this.tableFacade.tables()
      const existingTables = this.tableFacade.tables();
      const duplicate = existingTables.find(t => t.tableNumber === formValue.tableNumber && t.id !== this.data.table?.id);
      
      if (duplicate) {
        this.tableForm.get('tableNumber')?.setErrors({ notUnique: true });
        this.isSubmitting = false;
        return;
      }

      if (this.data.isEditing && this.data.table?.id) {
        await this.tableFacade.updateTable(this.data.table.id, formValue);
      } else {
        await this.tableFacade.createTable(formValue);
      }
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving table:', error);
    } finally {
      this.isSubmitting = false;
    }
  }
}
