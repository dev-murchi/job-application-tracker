import { computed, inject, Injectable, signal } from '@angular/core';
import { UserApi } from '../../api/user-api';
import { UserProfile } from '../../shared/types/user-profile.data';

export interface UserProfileState {
  profile: UserProfile | null;
  status: 'loading' | 'fetched' | 'updated' | 'error' | 'cached';
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly userApi = inject(UserApi);

  private readonly state = signal<UserProfileState>({
    profile: null,
    status: 'loading',
    error: null,
  });

  readonly currentUser = computed(() => {
    const state = this.state();
    return {
      profile: state.profile,
      isLoading: state.status === 'loading',
      isUpdated: state.status === 'updated',
      error: state.error,
    };
  });

  getProfile(): void {
    const currentState = this.state();
    if (currentState.profile) {
      if (currentState.status !== 'cached') {
        this.state.update(old => ({ ...old, status: 'cached' }));
      }
      return;
    }

    this.state.set({ profile: null, status: 'loading', error: null });

    this.userApi.getProfile().subscribe({
      next: profile => {
        if (profile) {
          this.state.set({ profile, status: 'fetched', error: null });
        }
      },
      error: err => {
        this.state.set({
          profile: null,
          status: 'error',
          error: 'Failed to load profile.',
        });
        console.error(err);
      },
    });
  }

  updateProfile(payload: Partial<UserProfile>): void {
    this.userApi.updateProfile(payload).subscribe({
      next: profile => {
        this.state.set({ profile, status: 'updated', error: null });
      },
      error: () => {
        this.state.update(old => ({
          ...old,
          status: 'error',
          error: 'Failed to update profile.',
        }));
      },
    });
  }

  clearCache(): void {
    this.state.set({ profile: null, status: 'loading', error: null });
  }
}
