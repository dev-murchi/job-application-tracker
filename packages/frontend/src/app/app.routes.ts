import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { authRoutes } from './features/auth/auth-routing';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
    title: 'Welcome',
  },
  {
    path: 'auth',
    children: authRoutes,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
