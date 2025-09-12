import { Routes } from "@angular/router";
import { Dashboard } from "./dashboard";
import { Test } from "./components/test/test";


export const dashboardRoutes: Routes = [
    {
        path: '',
        component: Dashboard,
        children: [
            { path: 'create-job', component: Test, data: { title: 'Create Job' } },
            { path: 'all-jobs', component: Test, data: { title: 'All Jobs' } },
            { path: 'profile', component: Test, data: { title: 'Profile' } },
            { path: 'stats', component: Test, data: { title: 'Stats' } },
        ],
    },
    { path: '**', pathMatch: 'full', redirectTo: '/not-found' }
]