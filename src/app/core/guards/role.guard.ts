import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { UserRepository } from '../repositories/user.repository';
import { map, take, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const userRepo = inject(UserRepository);
  const expectedRoles = route.data['roles'] as Array<string>;

  return authState(auth).pipe(
    take(1),
    switchMap(firebaseUser => {
      if (firebaseUser) {
        return userRepo.getById(firebaseUser.uid).pipe(
          map(user => {
            if (user && expectedRoles && expectedRoles.includes(user.role)) {
              return true;
            }
            return router.createUrlTree(['/login']);
          }),
          catchError(() => of(router.createUrlTree(['/login'])))
        );
      }
      return of(router.createUrlTree(['/login']));
    })
  );
};
