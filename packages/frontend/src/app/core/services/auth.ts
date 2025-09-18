import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthApi, UserLoginData, UserRegisterData } from '../../features/auth/services/auth-api';
import { catchError, tap } from 'rxjs/operators';
import { AlertService } from '../../shared/components/alert/alert-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);

  register(userData: UserRegisterData): Observable<any> {
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

  login(loginData: UserLoginData): Observable<any> {
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
        this.alertService.show('You have been logged out.', 'success');
        this.router.navigate(['/']);
      }),
    );
  }
}
