import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { authRoutes } from './features/auth/auth.routes';
import { authGuard } from './core/guards/auth-guard';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { NotFoundPage } from './features/not-found-page/not-found-page';

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
    path: 'dashboard',
    canActivateChild: [authGuard],
    children: dashboardRoutes
  },
  {
    path: 'not-found',
    component: NotFoundPage,
  },
  {
    path: '**',
    redirectTo: '/not-found',
    pathMatch: 'full',
  },
];
