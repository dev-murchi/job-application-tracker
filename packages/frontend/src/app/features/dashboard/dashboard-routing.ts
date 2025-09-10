import { Routes } from "@angular/router";
import { Dashboard } from "./dashboard";


export const dashboardRoutes: Routes = [
    { path: '', component: Dashboard },
    { path: '**', pathMatch: 'full', redirectTo: '/not-found' }
]