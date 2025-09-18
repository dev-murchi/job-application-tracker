import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { UserApi } from '../../api/user-api';
import { AlertService } from '../../shared/components/alert/alert-service';
import { UserProfile } from '../../shared/types/user-profile.data';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly userApi = inject(UserApi);
  private readonly alertService = inject(AlertService);

  private userProfile = signal<UserProfile | null>(null);
  public readonly currentUser = this.userProfile.asReadonly();

  getProfile(): Observable<UserProfile> {
    const profile = this.userProfile();
    if (profile) {
      return of(profile);
    }

    return this.userApi.getProfile().pipe(
      filter((profile: UserProfile | null): profile is UserProfile => !!profile),
      map(data => data),
      tap(data => {
        this.userProfile.set(data);
      }),
    );
  }

  updateProfile(payload: Partial<UserProfile>): Observable<any> {
    return this.userApi.updateProfile(payload).pipe(
      tap((updatedProfile) => {
        this.userProfile.set(updatedProfile);
        this.alertService.show('Profile updated successfully!', 'success');
      }),
      catchError((err) => {
        this.alertService.show('Failed to update profile.', 'error');
        return throwError(() => err);
      })
    );
  }

  clearCache(): void {
    this.userProfile.set(null);
  }
}
