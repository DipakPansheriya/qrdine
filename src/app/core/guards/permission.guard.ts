import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);
  const expectedPermission = route.data['permission'] as string;

  if (!expectedPermission) return true;

  if (permissionService.hasPermission(expectedPermission)) {
    return true;
  }

  // If unauthorized, bouncing to login will safely route them back to their appropriate dashboard 
  // via the active session mapping, preventing them from accessing forbidden modules.
  return router.createUrlTree(['/login']);
};
