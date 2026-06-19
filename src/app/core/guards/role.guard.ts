import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthFacade } from '../facades/auth.facade';

export const roleGuard: CanActivateFn = (route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as Array<string>;
  const user = authFacade.currentUser();

  if (user && expectedRoles && expectedRoles.includes(user.role)) {
    return true;
  }

  // Not authorized or invalid role
  return router.createUrlTree(['/login']);
};
