import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from '../shared/types/user-profile.data';

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private readonly apiUrl = '/api/users';
  private readonly http = inject(HttpClient);

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiUrl}/update`, payload);
  }
}
