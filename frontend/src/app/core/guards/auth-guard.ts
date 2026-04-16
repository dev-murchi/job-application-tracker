import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth';

/** Matches only when the user IS authenticated. Used with canMatch on dashboard routes. */
export const authCanMatchGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  return await authService.validateAuthStatus();
};

/** Matches only when the user is NOT authenticated (guest). Used with canMatch on the landing route. */
export const guestCanMatchGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  return !(await authService.validateAuthStatus());
};
