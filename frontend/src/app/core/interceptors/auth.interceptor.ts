import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthApi } from '../services/auth-api';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authApi = inject(AuthApi);
  const router = inject(Router);

  const token = authApi.accessToken();

  const authenticatedRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !request.url.includes('/auth/login') &&
        !request.url.includes('/auth/register')
      ) {
        authApi.logout();

        void router.navigateByUrl('/login', {
          replaceUrl: true,
        });
      }

      return throwError(() => error);
    }),
  );
};
