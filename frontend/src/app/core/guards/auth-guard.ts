import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isValid = await authService.validateAuthStatus();

  if (isValid) {
    console.log('AuthGuard: User is valid. Access granted.');
    return true;
  } else {
    console.log('AuthGuard: User is not valid. Redirecting to login.');
    router.navigate(['/not-found']);
    return false;
  }
};
