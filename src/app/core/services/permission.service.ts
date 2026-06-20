import { Injectable, inject } from '@angular/core';
import { AuthFacade } from '../facades/auth.facade';
import { Role } from '../models';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  'Super Admin': ['*'],
  'Owner': ['*'],
  'Manager': ['view_dashboard', 'manage_orders', 'manage_tables', 'manage_menu', 'manage_staff', 'view_analytics', 'manage_settings'],
  'Waiter': ['view_dashboard', 'view_tables', 'view_orders', 'handle_customer_requests'],
  'Kitchen': ['view_orders', 'update_order_status'],
  'Cashier': ['view_bills', 'process_payments'],
  'Customer': []
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private authFacade = inject(AuthFacade);

  hasPermission(permission: string): boolean {
    const user = this.authFacade.currentUser();
    if (!user || !user.role) return false;

    // Direct override from Firestore permissions
    if (user.permissions && (user.permissions.includes(permission) || user.permissions.includes('*'))) {
      return true;
    }
    
    // Check fallback default roles
    const defaultPerms = ROLE_PERMISSIONS[user.role] || [];
    if (defaultPerms.includes('*')) return true;
    
    return defaultPerms.includes(permission);
  }

  hasRole(role: Role): boolean {
    const user = this.authFacade.currentUser();
    if (!user) return false;
    return user.role === role;
  }
}
