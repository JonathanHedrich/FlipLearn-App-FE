import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  if (!authStore.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
