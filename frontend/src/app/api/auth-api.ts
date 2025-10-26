import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserLogin } from '../shared/types/user-login.data';
import { UserRegister } from '../shared/types/user-register.data';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly apiUrl = '/api';
  private readonly http = inject(HttpClient);

  register(payload: UserRegister): Observable<any> {
    console.log('API call: Attempting to register user:', payload.email);
    return this.http.post(`${this.apiUrl}/auth/register`, payload);
  }

  login(payload: UserLogin): Observable<any> {
    console.log('API call: Attempting to login user:', payload.email);
    return this.http.post(`${this.apiUrl}/auth/login`, payload);
  }

  logout(): Observable<any> {
    console.log('API call: Attempting to logout');
    return this.http.get(`${this.apiUrl}/auth/logout`);
  }
}
