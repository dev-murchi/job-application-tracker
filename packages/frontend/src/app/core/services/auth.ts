import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthApi, UserRegisterData } from '../../features/auth/services/auth-api';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  register(userData: UserRegisterData ): Observable<any> {
    return this.authApi.register(userData).pipe(
      tap((response) => {
        console.log(response.message);
        this.router.navigate(['/auth/login']);
      }),
    );
  }
}
