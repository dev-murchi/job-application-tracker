import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from './auth';
import { AuthApi } from '../../api/auth-api';
import { Router } from '@angular/router';
import { AlertService } from '../../shared/components/alert/alert-service';
import { UsersService } from './users';

const guestState = {
  profile: null,
  isLoading: false,
  isGuest: true,
  isUpdated: false,
  error: null,
};
const authedState = {
  profile: { name: 'J', lastName: 'D', email: 'j@d.com', location: '', avatar: '' },
  isLoading: false,
  isGuest: false,
  isUpdated: false,
  error: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let authApiSpy: jasmine.SpyObj<AuthApi>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let usersSpy: jasmine.SpyObj<UsersService>;

  beforeEach(() => {
    authApiSpy = jasmine.createSpyObj('AuthApi', ['login', 'register', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertSpy = jasmine.createSpyObj('AlertService', ['show']);
    usersSpy = jasmine.createSpyObj('UsersService', [
      'getProfile',
      'currentUser',
      'setAsGuest',
      'reset',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApi, useValue: authApiSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: UsersService, useValue: usersSpy },
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticating starts as false', () => {
    expect(service.isAuthenticating()).toBeFalse();
  });

  describe('login()', () => {
    it('calls reset(), shows alert, and navigates to /', () => {
      authApiSpy.login.and.returnValue(of({}));

      service.login({ email: 'a@b.com', password: 'pw' }).subscribe();

      expect(usersSpy.reset).toHaveBeenCalled();
      expect(alertSpy.show).toHaveBeenCalledWith('Login successful!', 'success');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('sets isAuthenticating to true while request is in flight', () => {
      const subject = new Subject<unknown>();
      authApiSpy.login.and.returnValue(subject.asObservable());

      service.login({ email: 'a@b.com', password: 'pw' }).subscribe();
      expect(service.isAuthenticating()).toBeTrue();

      subject.next({});
      subject.complete();
      expect(service.isAuthenticating()).toBeFalse();
    });

    it('resets isAuthenticating to false after login error', () => {
      const subject = new Subject<unknown>();
      authApiSpy.login.and.returnValue(subject.asObservable());

      service.login({ email: 'a@b.com', password: 'pw' }).subscribe({ error: () => {} });
      expect(service.isAuthenticating()).toBeTrue();

      subject.error(new Error('401'));
      expect(service.isAuthenticating()).toBeFalse();
    });
  });

  describe('validateAuthStatus()', () => {
    it('returns false immediately when user is guest without calling getProfile', async () => {
      usersSpy.currentUser.and.returnValue(guestState);

      const result = await service.validateAuthStatus();

      expect(result).toBeFalse();
      expect(usersSpy.getProfile).not.toHaveBeenCalled();
    });

    it('returns true immediately when profile is already loaded', async () => {
      usersSpy.currentUser.and.returnValue(authedState);

      const result = await service.validateAuthStatus();

      expect(result).toBeTrue();
      expect(usersSpy.getProfile).not.toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    it('calls setAsGuest(), shows alert, and navigates to / with onSameUrlNavigation reload', () => {
      authApiSpy.logout.and.returnValue(of({}));
      usersSpy.currentUser.and.returnValue(guestState);

      service.logout().subscribe();

      expect(usersSpy.setAsGuest).toHaveBeenCalled();
      expect(alertSpy.show).toHaveBeenCalledWith('You have been logged out.', 'success');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/'], { onSameUrlNavigation: 'reload' });
    });

    it('sets isAuthenticating to true while request is in flight', () => {
      const subject = new Subject<unknown>();
      authApiSpy.logout.and.returnValue(subject.asObservable());

      service.logout().subscribe();
      expect(service.isAuthenticating()).toBeTrue();

      subject.next({});
      subject.complete();
      expect(service.isAuthenticating()).toBeFalse();
    });

    it('resets isAuthenticating to false after logout error', () => {
      const subject = new Subject<unknown>();
      authApiSpy.logout.and.returnValue(subject.asObservable());

      service.logout().subscribe({ error: () => {} });
      expect(service.isAuthenticating()).toBeTrue();

      subject.error(new Error('network'));
      expect(service.isAuthenticating()).toBeFalse();
    });
  });
});
