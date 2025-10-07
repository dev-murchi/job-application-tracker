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

  async validateAuthStatus(): Promise<boolean> {
    // If we already have a profile, return immediately
    const currentProfile = this.usersService.currentUser();
    if (currentProfile) {
      return true;
    }

    // If not loading and no profile, try to fetch it
    if (!this.usersService.isLoading()) {
      this.usersService.getProfile();
    }

    // Wait for the loading to complete and check if we got a profile
    const stateSignal = computed(() => ({
      isLoading: this.usersService.isLoading(),
      error: this.usersService.error(),
      profile: this.usersService.currentUser()
    }));

    const result = await firstValueFrom(
      toObservable(stateSignal).pipe(
        filter(state => !state.isLoading),
        map(state => !!state.profile && !state.error)
      )
    );

    return result;
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
