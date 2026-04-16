import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isValid = await authService.validateAuthStatus();

  if (isValid) {
    return true;
  } else {
    router.navigate(['/not-found']);
    return false;
  }
};
