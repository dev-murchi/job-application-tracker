import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { authRoutes } from './features/auth/auth.routes';
import { authCanMatchGuard, guestCanMatchGuard } from './core/guards/auth-guard';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { DashboardLayout } from './features/dashboard/dashboard-layout';
import { NotFoundPage } from './features/not-found-page/not-found-page';

export const routes: Routes = [
  {
    path: 'auth',
    children: authRoutes,
  },
  // '/' for guests — landing page
  {
    path: '',
    component: Landing,
    canMatch: [guestCanMatchGuard],
    title: 'Welcome',
  },
  // '/' for authenticated users — dashboard (no /dashboard in URL)
  {
    path: '',
    component: DashboardLayout,
    canMatch: [authCanMatchGuard],
    children: dashboardRoutes,
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
