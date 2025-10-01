import { Routes } from "@angular/router";
import { DashboardLayout } from "./dashboard-layout";
import { Statistics } from "./components/statistics/statistics";
import { UserProfileComponent } from "./components/user-profile/user-profile";
import { Jobs } from "./components/jobs/jobs";
import { JobForm } from "./components/job-form/job-form";
import { Dashboard } from "./components/dashboard/dashboard";
import { JobDetail } from "./components/job-detail/job-detail";


export const dashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardLayout,
        children: [
            { path: '', component: Dashboard, data: { title: 'Dashboard' } },
            { path: 'create-job', component: JobForm, data: { title: 'Create Job' } },
            { path: 'jobs', component: Jobs, data: { title: 'All Jobs' } },
            { path: 'profile', component: UserProfileComponent, data: { title: 'Profile' } },
            { path: 'stats', component: Statistics, data: { title: 'Stats' } },
            { path: 'jobs/:jobId', component: JobDetail, data: { title: 'Job Detail' } },
        ],
    },
    { path: '**', pathMatch: 'full', redirectTo: '/not-found' }
]