import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthApi } from '../services/auth-api';

export const authGuard: CanActivateFn = (route, state) => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  if (authApi.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
