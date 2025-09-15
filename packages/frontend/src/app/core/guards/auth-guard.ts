import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if(authService.isLoggedIn()) {
    console.log('AuthGuard: User is logged in. Access granted.');
    return true;
  } else {
    console.log('AuthGuard: User is not logged in. Redirecting to login.');
    router.navigate(['/not-found']);
    return false;
  }
};
