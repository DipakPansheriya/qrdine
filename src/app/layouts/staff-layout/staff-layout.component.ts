import { Component } from '@angular/core';
import { DashboardLayoutComponent } from '../dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [DashboardLayoutComponent],
  template: `<app-dashboard-layout></app-dashboard-layout>`
})
export class StaffLayoutComponent {}
