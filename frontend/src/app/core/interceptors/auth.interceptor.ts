import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { UsersService } from '../services/users';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const usersService = inject(UsersService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !authService.isAuthenticating()
      ) {
        usersService.setAsGuest();
      }
      return throwError(() => err);
    }),
  );
};
