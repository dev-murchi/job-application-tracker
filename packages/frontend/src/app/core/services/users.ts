import { computed, inject, Injectable, signal } from '@angular/core';
import { UserApi } from '../../api/user-api';
import { UserProfile } from '../../shared/types/user-profile.data';

export interface UserProfileState {
  profile: UserProfile | null;
  status: 'pending' | 'loading' | 'fetched' | 'updated' | 'error';
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly userApi = inject(UserApi);

  private readonly state = signal<UserProfileState>({ profile: null, status: 'pending', error: null });

  readonly currentUser = computed(() => this.state().profile);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);
  readonly isUpdated = computed(() => this.state().status === 'updated');

  getProfile(): void {
    const currentState = this.state();
    if (currentState.status === 'loading' || currentState.status === 'fetched' || currentState.status === 'updated') {
      return;
    }

    this.state.set({ profile: null, status: 'loading', error: null });

    this.userApi.getProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.state.set({ profile, status: 'fetched', error: null });
        } else {
          this.state.set({ profile: null, status: 'error', error: 'User profile not found.' });
        }
      },
      error: (err) => {
        this.state.set({ profile: null, status: 'error', error: 'Failed to load profile.' });
        console.error(err);
      }
    });
  }

  updateProfile(payload: Partial<UserProfile>) {
    this.userApi.updateProfile(payload).subscribe({
      next: (profile) => {
        this.state.set({ profile, status: 'updated', error: null });
      },
      error: () => {
        this.state.update(s => ({ ...s, status: 'error', error: 'Failed to update profile.' }));
      }
    });
  }

  clearCache(): void {
    this.state.set({ profile: null, status: 'pending', error: null });
  }
}
