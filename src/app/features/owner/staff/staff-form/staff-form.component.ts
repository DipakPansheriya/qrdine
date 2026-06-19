import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { StaffFacade } from '../../../../core/facades/staff.facade';
import { Staff } from '../../../../core/models';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.scss']
})
export class StaffFormComponent implements OnInit {
  staffForm: FormGroup;
  isEditMode = false;
  private facade = inject(StaffFacade);

  roles = ['Manager', 'Waiter', 'Kitchen', 'Cashier'];
  statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StaffFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { staff?: Staff }
  ) {
    this.isEditMode = !!data?.staff;
    this.staffForm = this.fb.group({
      name: [data?.staff?.name || '', Validators.required],
      email: [data?.staff?.email || '', [Validators.required, Validators.email]],
      phone: [data?.staff?.phone || ''],
      role: [data?.staff?.role || 'Waiter', Validators.required],
      status: [data?.staff?.status || 'ACTIVE', Validators.required],
      // Temporary password is only needed when creating new staff
      password: ['']
    });

    if (!this.isEditMode) {
      this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.staffForm.valid) {
      const formValue = this.staffForm.value;
      
      if (this.isEditMode && this.data.staff?.staffId) {
        await this.facade.updateStaff(this.data.staff.staffId, {
          name: formValue.name,
          email: formValue.email,
          phone: formValue.phone,
          role: formValue.role,
          status: formValue.status
        });
      } else {
        await this.facade.addStaff({
          name: formValue.name,
          email: formValue.email,
          phone: formValue.phone,
          role: formValue.role,
          status: formValue.status
          // Note: In MVP, password isn't directly passed to staff facade, 
          // but would be used in Cloud Function.
        });
      }
      this.dialogRef.close(true);
    }
  }
}
