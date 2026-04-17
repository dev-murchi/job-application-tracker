import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { UsersService } from './users';
import { UserApi } from '../../api/user-api';
import { UserProfile } from '../../shared/types/user-profile.data';

const mockProfile: UserProfile = {
  name: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  location: 'NYC',
  avatar: '',
};

describe('UsersService', () => {
  let service: UsersService;
  let userApiSpy: jasmine.SpyObj<UserApi>;

  beforeEach(() => {
    userApiSpy = jasmine.createSpyObj('UserApi', ['getProfile', 'updateProfile']);

    TestBed.configureTestingModule({
      providers: [
        UsersService,
        { provide: UserApi, useValue: userApiSpy },
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile()', () => {
    it('401 response → isGuest is true, profile null, error null', () => {
      const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      userApiSpy.getProfile.and.returnValue(throwError(() => err));

      service.getProfile();

      const state = service.currentUser();
      expect(state.isGuest).toBeTrue();
      expect(state.profile).toBeNull();
      expect(state.error).toBeNull();
    });

    it('500 response → isGuest false, error message set', () => {
      const err = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      userApiSpy.getProfile.and.returnValue(throwError(() => err));

      service.getProfile();

      const state = service.currentUser();
      expect(state.isGuest).toBeFalse();
      expect(state.error).toBe('Failed to load profile.');
    });

    it('when status is guest → no HTTP call made', () => {
      service.setAsGuest();
      userApiSpy.getProfile.calls.reset();

      service.getProfile();

      expect(userApiSpy.getProfile).not.toHaveBeenCalled();
    });

    it('successful fetch → profile set, isGuest false', () => {
      userApiSpy.getProfile.and.returnValue(of(mockProfile));

      service.getProfile();

      const state = service.currentUser();
      expect(state.profile).toEqual(mockProfile);
      expect(state.isGuest).toBeFalse();
    });
  });

  describe('setAsGuest()', () => {
    it('sets isGuest to true', () => {
      service.setAsGuest();

      expect(service.currentUser().isGuest).toBeTrue();
    });

    it('is idempotent – calling twice stays guest', () => {
      service.setAsGuest();
      service.setAsGuest();

      expect(service.currentUser().isGuest).toBeTrue();
    });
  });

  describe('reset()', () => {
    it('resets isGuest to false and isLoading to true', () => {
      service.setAsGuest();
      service.reset();

      const state = service.currentUser();
      expect(state.isGuest).toBeFalse();
      expect(state.isLoading).toBeTrue();
      expect(state.profile).toBeNull();
    });
  });
});
