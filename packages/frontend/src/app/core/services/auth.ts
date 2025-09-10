import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthApi, UserLoginData, UserRegisterData } from '../../features/auth/services/auth-api';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  register(userData: UserRegisterData): Observable<any> {
    return this.authApi.register(userData).pipe(
      tap((response) => {
        console.log({ response });
        this.router.navigate(['/auth/login']);
      }),
    );
  }

  login(loginData: UserLoginData): Observable<any> {
    return this.authApi.login(loginData).pipe(
      tap((response) => {
        console.log({ response });
        localStorage.setItem('auth_token', response.token);
        this.router.navigate(['/dashboard']);
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}
