import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserApi } from '../../api/user-api';
import { UserProfile } from '../../shared/types/user-profile.data';

export interface UserProfileState {
  profile: UserProfile | null;
  status: 'loading' | 'fetched' | 'updated' | 'error' | 'cached' | 'guest';
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
      isGuest: state.status === 'guest',
      error: state.error,
    };
  });

  getProfile(): void {
    const currentState = this.state();

    if (currentState.status === 'guest') {
      return;
    }

    if (currentState.profile) {
      if (currentState.status !== 'cached') {
        this.state.update(old => ({ ...old, status: 'cached' }));
      }
      return;
    }

    this.reset();

    this.userApi.getProfile().subscribe({
      next: profile => {
        this.state.set({ profile, status: 'fetched', error: null });
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.setAsGuest();
        } else {
          this.state.set({
            profile: null,
            status: 'error',
            error: 'Failed to load profile.',
          });
          console.error(err);
        }
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

  setAsGuest(): void {
    this.state.set({ profile: null, status: 'guest', error: null });
  }

  reset(): void {
    this.state.set({ profile: null, status: 'loading', error: null });
  }
}
