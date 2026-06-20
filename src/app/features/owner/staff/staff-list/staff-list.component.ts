import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { StaffFacade } from '../../../../core/facades/staff.facade';
import { StaffFormComponent } from '../staff-form/staff-form.component';
import { User } from '../../../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule, MatChipsModule, FormsModule],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss']
})
export class StaffListComponent implements OnInit {
  public facade = inject(StaffFacade);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  searchQuery = signal<string>('');
  
  filteredStaff = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.facade.staffList().filter(s => 
      (s.name || s.displayName || '').toLowerCase().includes(query) || 
      s.email.toLowerCase().includes(query) ||
      (s.phone && s.phone.includes(query)) ||
      (s.mobile && s.mobile.includes(query))
    );
  });

  ngOnInit() {}

  openStaffForm(staff?: User) {
    this.dialog.open(StaffFormComponent, {
      width: '500px',
      data: { staff }
    });
  }

  async toggleStatus(staff: User) {
    const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.facade.updateStaff(staff.uid, { status: newStatus });
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'Manager': return 'primary';
      case 'Waiter': return 'accent';
      case 'Kitchen': return 'warn';
      case 'Cashier': return 'primary';
      default: return '';
    }
  }
}
