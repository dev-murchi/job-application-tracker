import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';


export interface UserRegisterData {
  name: string,
  lastName: string,
  email: string,
  password: string,
  location: string,
}
export interface UserLoginData {
  email: string,
  password: string,
}

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly apiUrl = '/api';
  private readonly http = inject(HttpClient);

  constructor() {}

  register(payload: UserRegisterData): Observable<any> {
    console.log('API call: Attempting to register user:', payload.email);
    return this.http.post(`${this.apiUrl}/auth/register`, payload);
  }
  
  login(payload: UserLoginData): Observable<any> {
    console.log('API call: Attempting to login user:', payload.email);
    return this.http.post(`${this.apiUrl}/auth/login`, payload);
  }
  
  logout(): Observable<any> {
    console.log('API call: Attempting to logout',);
    return this.http.get(`${this.apiUrl}/auth/logout`);
  }
}
