import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthFacade } from '../../../../core/facades/auth.facade';
import { PermissionService } from '../../../../core/services/permission.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <!-- Brand -->
      <div class="brand">
        <div class="brand-icon">
          <mat-icon>restaurant</mat-icon>
        </div>
        <span class="brand-name" *ngIf="!isCollapsed">QRDine</span>
      </div>

      <!-- User Info -->
      <div class="user-info" *ngIf="!isCollapsed && user() as u">
        <div class="user-avatar">{{ getInitials(u.displayName || u.email) }}</div>
        <div class="user-details">
          <span class="user-name">{{ u.displayName || 'User' }}</span>
          <span class="user-role">{{ u.role }}</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="nav-section">
        <p class="nav-label" *ngIf="!isCollapsed">MAIN MENU</p>
        <a
          *ngFor="let item of allowedNavItems()"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="nav-item"
          [class.collapsed-item]="isCollapsed"
          [title]="isCollapsed ? item.label : ''">
          <div class="nav-icon-wrap">
            <mat-icon>{{ item.icon }}</mat-icon>
          </div>
          <span class="nav-label-text" *ngIf="!isCollapsed">{{ item.label }}</span>
          <div class="active-indicator"></div>
        </a>
      </nav>

      <!-- Bottom: Logout -->
      <div class="sidebar-footer">
        <a class="nav-item logout-item" [class.collapsed-item]="isCollapsed" (click)="logout()" style="cursor:pointer">
          <div class="nav-icon-wrap">
            <mat-icon>logout</mat-icon>
          </div>
          <span class="nav-label-text" *ngIf="!isCollapsed">Logout</span>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .sidebar {
      width: 240px;
      height: 100%;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      display: flex;
      flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      box-shadow: 4px 0 24px rgba(0,0,0,0.15);
    }

    .sidebar.collapsed {
      width: 68px;
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      position: relative;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
    }

    .brand-icon mat-icon {
      font-size: 1.3rem;
      width: 1.3rem;
      height: 1.3rem;
    }

    .brand-name {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
      flex: 1;
    }

    .collapse-btn {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.4);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }

    .collapse-btn:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }

    .expand-btn {
      margin: 0 auto;
    }

    /* User Info */
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      margin: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.07);
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4361ee, #a855f7);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      color: #f1f5f9;
      font-weight: 600;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      color: rgba(255,255,255,0.4);
      font-size: 0.72rem;
      margin-top: 1px;
    }

    /* Navigation */
    .nav-section {
      flex: 1;
      padding: 0.5rem 0.75rem;
      overflow-y: auto;
    }

    .nav-label {
      color: rgba(255,255,255,0.3);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      padding: 0.75rem 0.5rem 0.4rem;
      margin: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      text-decoration: none;
      color: rgba(255,255,255,0.55);
      transition: all 0.2s ease;
      margin-bottom: 2px;
      position: relative;
      cursor: pointer;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.9);
    }

    .nav-item.active {
      background: rgba(67, 97, 238, 0.2);
      color: #818cf8;
    }

    .nav-item.active .nav-icon-wrap {
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      color: white;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.4);
    }

    .active-indicator {
      display: none;
    }

    .nav-item.active .active-indicator {
      display: block;
      position: absolute;
      right: -0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: #818cf8;
      border-radius: 3px 0 0 3px;
    }

    .nav-icon-wrap {
      width: 34px;
      height: 34px;
      min-width: 34px;
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .nav-icon-wrap mat-icon {
      font-size: 1.15rem;
      width: 1.15rem;
      height: 1.15rem;
    }

    .nav-label-text {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .collapsed-item {
      justify-content: center;
      padding: 0.65rem;
    }

    /* Footer */
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.07);
    }

    .logout-item {
      color: rgba(255, 100, 100, 0.6);
    }

    .logout-item:hover {
      background: rgba(255, 100, 100, 0.08);
      color: #f87171;
    }

    .logout-item .nav-icon-wrap {
      background: rgba(255, 100, 100, 0.08);
    }

    /* Scrollbar styling */
    .nav-section::-webkit-scrollbar {
      width: 4px;
    }
    .nav-section::-webkit-scrollbar-track {
      background: transparent;
    }
    .nav-section::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
  `]
})
export class SidebarComponent {
  private authFacade = inject(AuthFacade);
  private permissionService = inject(PermissionService);
  user = this.authFacade.currentUser;
  @Input() isCollapsed = false;

  private navItems: NavItem[] = [
    { label: 'System Dashboard', icon: 'grid_view', route: '/admin/dashboard', permission: '*' },
    { label: 'Restaurants', icon: 'store', route: '/admin/restaurants', permission: '*' },
    { label: 'Dashboard', icon: 'grid_view', route: '/owner/dashboard', permission: 'view_dashboard' },
    { label: 'Menu Management', icon: 'menu_book', route: '/owner/menu', permission: 'manage_menu' },
    { label: 'Table Management', icon: 'table_bar', route: '/owner/tables', permission: 'manage_tables' },
    { label: 'Staff Management', icon: 'group', route: '/owner/staff', permission: 'manage_staff' },
    { label: 'Settings', icon: 'tune', route: '/owner/settings', permission: 'manage_settings' },
    { label: 'Waiter Dashboard', icon: 'table_restaurant', route: '/waiter/dashboard', permission: 'view_tables' },
    { label: 'Kitchen Orders', icon: 'receipt', route: '/kitchen/orders', permission: 'update_order_status' },
    { label: 'Cashier Dashboard', icon: 'point_of_sale', route: '/cashier/dashboard', permission: 'view_bills' }
  ];

  allowedNavItems = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return [];
    
    return this.navItems.filter(item => {
      // Super Admins only see admin routes
      if (currentUser.role === 'Super Admin') {
        return item.route.startsWith('/admin');
      }
      
      return this.permissionService.hasPermission(item.permission);
    });
  });


  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  }

  logout() {
    this.authFacade.logout();
  }
}
