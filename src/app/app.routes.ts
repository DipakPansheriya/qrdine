import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'change-password', loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'register-success', loadComponent: () => import('./features/auth/register-success/register-success.component').then(m => m.RegisterSuccessComponent) }
    ]
  },
  {
    path: 'debug-setup',
    loadComponent: () => import('./features/auth/debug-setup/debug-setup.component').then(m => m.DebugSetupComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: '*' },
    children: [
      { path: '', redirectTo: 'restaurants', pathMatch: 'full' },
      {
        path: 'restaurants',
        loadComponent: () => import('./features/admin/restaurants/restaurant-list/restaurant-list.component').then(m => m.RestaurantListComponent)
      },
      {
        path: 'restaurants/new',
        loadComponent: () => import('./features/admin/restaurants/restaurant-form/restaurant-form.component').then(m => m.RestaurantFormComponent)
      },
      {
        path: 'restaurants/:id',
        loadComponent: () => import('./features/admin/restaurants/restaurant-detail/restaurant-detail.component').then(m => m.RestaurantDetailComponent)
      },
      {
        path: 'restaurants/:id/edit',
        loadComponent: () => import('./features/admin/restaurants/restaurant-form/restaurant-form.component').then(m => m.RestaurantFormComponent)
      }
    ]
  },
  {
    path: 'owner',
    loadComponent: () => import('./layouts/owner-layout/owner-layout.component').then(m => m.OwnerLayoutComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'view_dashboard' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/owner/dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent) },
      { path: 'menu', loadComponent: () => import('./features/owner/menu/menu-layout/menu-layout.component').then(m => m.MenuLayoutComponent) },
      { path: 'tables', loadComponent: () => import('./features/owner/tables/table-layout/table-layout.component').then(m => m.TableLayoutComponent) },
      { path: 'staff', loadComponent: () => import('./features/owner/staff/staff-list/staff-list.component').then(m => m.StaffListComponent) },
      { path: 'notifications', loadComponent: () => import('./features/owner/notifications/notifications.component').then(m => m.OwnerNotificationsComponent) },
      { path: 'settings', loadComponent: () => import('./features/owner/settings/settings-dashboard/settings-dashboard.component').then(m => m.SettingsDashboardComponent) }
    ]
  },
  {
    path: 'kitchen',
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'update_order_status' },
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      { path: 'orders', loadComponent: () => import('./features/kitchen/kitchen-orders/kitchen-orders.component').then(m => m.KitchenOrdersComponent) }
    ]
  },
  {
    path: 'waiter',
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'view_tables' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/waiter/waiter-dashboard/waiter-dashboard.component').then(m => m.WaiterDashboardComponent) }
    ]
  },
  {
    path: 'cashier',
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'view_bills' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/cashier/cashier-dashboard/cashier-dashboard.component').then(m => m.CashierDashboardComponent) }
    ]
  },
  {
    path: 'staff',
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'view_dashboard' },
    children: [
      // Staff specific routes
    ]
  },
  {
    path: 'q/:restaurantId',
    loadComponent: () => import('./layouts/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      // Customer specific routes (no guards required for public access)
    ]
  },
  {
    path: 'menu/:restaurantId/:tableId',
    loadComponent: () => import('./features/customer/customer-layout/customer-layout.component').then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/customer/customer-menu/customer-menu.component').then(m => m.CustomerMenuComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/customer/customer-orders/customer-orders.component').then(m => m.CustomerOrdersComponent)
      },
      {
        path: 'success/:orderId',
        loadComponent: () => import('./features/customer/order-success/order-success.component').then(m => m.OrderSuccessComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
