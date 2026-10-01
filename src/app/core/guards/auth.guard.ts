import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user/user.service';

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (userService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const moderatorGuard: CanActivateFn = () => {
  const user = inject(UserService);
  const router = inject(Router);
  return user.getCurrentUser()?.occurrenceRole === 'MODERATOR'
    ? true : router.createUrlTree([user.isLoggedIn() ? '/publicacoes' : '/login']);
};
