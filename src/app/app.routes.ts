import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Super Admin'] },
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
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Owner', 'Manager'] },
    children: [
      { path: '', redirectTo: 'menu', pathMatch: 'full' },
      { path: 'menu', loadComponent: () => import('./features/owner/menu/menu-layout/menu-layout.component').then(m => m.MenuLayoutComponent) }
    ]
  },
  {
    path: 'staff',
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component').then(m => m.StaffLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Waiter', 'Kitchen', 'Cashier'] },
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
    path: '**',
    redirectTo: 'login'
  }
];
