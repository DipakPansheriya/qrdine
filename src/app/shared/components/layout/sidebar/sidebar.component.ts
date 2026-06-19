import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthFacade } from '../../../../core/facades/auth.facade';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  template: `
    <div class="sidebar-container">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <mat-icon>restaurant</mat-icon>
        </div>
        <span class="brand-name">QRDine</span>
      </div>
      <div class="sidebar-menu-title">Main Menu</div>
      <mat-nav-list class="sidebar-list">
        <ng-container *ngFor="let item of allowedNavItems()">
          <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon class="nav-icon">{{ item.icon }}</mat-icon>
            <div matListItemTitle class="nav-text">{{ item.label }}</div>
          </a>
        </ng-container>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar-container {
      height: 100%;
      background: #ffffff;
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      background: var(--brand-primary);
      color: #fff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
    }
    .brand-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .sidebar-menu-title {
      padding: 1.5rem 1.5rem 0.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 1px;
    }
    .sidebar-list {
      padding: 0.5rem 1rem;
    }
    .nav-item {
      border-radius: 8px !important;
      margin-bottom: 0.25rem;
      transition: all 0.2s ease;
    }
    .nav-icon {
      color: var(--text-secondary);
    }
    .nav-text {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .nav-item:hover {
      background: var(--surface-hover);
    }
    .active-link {
      background: rgba(67, 97, 238, 0.08) !important;
      border-left: 4px solid var(--brand-primary);
    }
    .active-link .nav-icon {
      color: var(--brand-primary);
    }
    .active-link .nav-text {
      color: var(--brand-primary);
      font-weight: 600;
    }
  `]
})
export class SidebarComponent {
  private authFacade = inject(AuthFacade);
  user = this.authFacade.currentUser;

  // Master list of all possible navigation items
  private navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', roles: ['Super Admin'] },
    { label: 'Restaurants', icon: 'store', route: '/admin/restaurants', roles: ['Super Admin'] },
    { label: 'Dashboard', icon: 'dashboard', route: '/owner/dashboard', roles: ['Owner', 'Manager'] },
    { label: 'Menu Management', icon: 'restaurant_menu', route: '/owner/menu', roles: ['Owner', 'Manager'] },
    { label: 'Staff Management', icon: 'people', route: '/owner/staff', roles: ['Owner'] },
    { label: 'Active Tables', icon: 'table_restaurant', route: '/staff/tables', roles: ['Waiter', 'Manager'] },
    { label: 'Kitchen Orders', icon: 'receipt', route: '/staff/kitchen', roles: ['Kitchen', 'Manager'] },
    { label: 'Checkout/Billing', icon: 'point_of_sale', route: '/staff/billing', roles: ['Cashier', 'Manager'] }
  ];

  // Dynamically filter items based on current user's role
  allowedNavItems = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return [];
    return this.navItems.filter(item => item.roles.includes(currentUser.role));
  });
}
