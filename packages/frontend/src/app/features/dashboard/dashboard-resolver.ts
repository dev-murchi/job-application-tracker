import { ResolveFn } from '@angular/router';
import { UsersService } from '../../core/services/users';
import { inject } from '@angular/core';

export const dashboardResolver: ResolveFn<boolean> = (route, state) => {
  const usersService = inject(UsersService);
  usersService.getProfile().subscribe();
  return true;
};
