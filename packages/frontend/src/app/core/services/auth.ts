import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { AlertService } from '../../shared/components/alert/alert-service';
import { AuthApi } from '../../api/auth-api';
import { UserLogin } from '../../shared/types/user-login.data';
import { UserRegister } from '../../shared/types/user-register.data';
import { UsersService } from './users';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly usersService = inject(UsersService);

  register(userData: UserRegister): Observable<any> {
    return this.authApi.register(userData).pipe(
      tap(() => {
        this.alertService.show('Registration successful!', 'success');
        this.router.navigate(['/auth/login']);
      }),
      catchError((err) => {
        this.alertService.show('Registration failed! Please try again.', 'error');
        return throwError(() => err);
      }),
    );
  }

  login(loginData: UserLogin): Observable<any> {
    return this.authApi.login(loginData).pipe(
      tap((response) => {
        localStorage.setItem('auth_token', response.token);
        this.alertService.show('Login successful!', 'success');
        this.router.navigate(['/dashboard']);
      }),
      catchError((err) => {
        this.alertService.show('Login failed! Please check your credentials.', 'error');
        return throwError(() => err);
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  logout(): Observable<any> {
    return this.authApi.logout().pipe(
      tap(() => {
        localStorage.removeItem('auth_token');
        this.usersService.clearCache();
        this.alertService.show('You have been logged out.', 'success');
        this.router.navigate(['/']);
      }),
    );
  }
}
