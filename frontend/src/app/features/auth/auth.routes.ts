import { Routes } from '@angular/router';
import { Auth } from './auth';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
export const authRoutes: Routes = [
  {
    path: '',
    component: Auth,
    children: [
      { path: 'login', component: Login, title: 'Login' },
      { path: 'register', component: Register, title: 'Register' },
      { path: '**', redirectTo: '/not-found', pathMatch: 'full' }
    ]
  }
];