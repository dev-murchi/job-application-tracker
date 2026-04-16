import { Routes } from '@angular/router';
import { Statistics } from './components/statistics/statistics';
import { UserProfileComponent } from './components/user-profile/user-profile';
import { Jobs } from './components/jobs/jobs';
import { JobForm } from './components/job-form/job-form';
import { Dashboard } from './components/dashboard/dashboard';
import { JobDetail } from './components/job-detail/job-detail';

// DashboardLayout is used as the parent component in app.routes.ts.
// These are its child routes, served directly under '/'.
export const dashboardRoutes: Routes = [
  { path: '', component: Dashboard, data: { title: 'Dashboard' } },
  { path: 'create-job', component: JobForm, data: { title: 'Create Job' } },
  { path: 'jobs', component: Jobs, data: { title: 'All Jobs' } },
  { path: 'profile', component: UserProfileComponent, data: { title: 'Profile' } },
  { path: 'stats', component: Statistics, data: { title: 'Stats' } },
  { path: 'jobs/:jobId/edit', component: JobForm, data: { title: 'Job Edit' } },
  { path: 'jobs/:jobId', component: JobDetail, data: { title: 'Job Detail' } },
  { path: '**', pathMatch: 'full', redirectTo: '/not-found' },
];
