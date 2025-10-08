import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { AlertService } from '../../shared/components/alert/alert-service';
import { AuthApi } from '../../api/auth-api';
import { UserLogin } from '../../shared/types/user-login.data';
import { UserRegister } from '../../shared/types/user-register.data';
import { UsersService } from './users';
import { toObservable } from '@angular/core/rxjs-interop';

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
      tap(() => {
        this.alertService.show('Login successful!', 'success');
        this.router.navigate(['/dashboard']);
      }),
      catchError((err) => {
        this.alertService.show('Login failed! Please check your credentials.', 'error');
        return throwError(() => err);
      }),
    );
  }

  async validateAuthStatus(): Promise<boolean> {
    if (this.usersService.currentUser().profile) {
      return true;
    }

    this.usersService.getProfile();

    return await firstValueFrom(
      toObservable(this.usersService.currentUser).pipe(
        filter(state => !state.isLoading),
        map(state => !!state.profile)
      )
    );
  }

  logout(): Observable<any> {
    return this.authApi.logout().pipe(
      tap(() => {
        this.usersService.clearCache();
        this.alertService.show('You have been logged out.', 'success');
        this.router.navigate(['/']);
      }),
    );
  }
}
