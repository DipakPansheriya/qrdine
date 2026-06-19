import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthFacade } from '../facades/auth.facade';

export const authGuard: CanActivateFn = (route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  if (authFacade.currentUser()) {
    return true;
  }

  // Check if they are trying to access a protected route without a session
  return router.createUrlTree(['/login']);
};
