import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { AuthApi } from '../../api/auth-api';
import { Router } from '@angular/router';
import { AlertService } from '../../shared/components/alert/alert-service';
import { UsersService } from './users';

describe('AuthService', () => {
  let service: AuthService;
  let authApiSpy: jasmine.SpyObj<AuthApi>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let usersSpy: jasmine.SpyObj<UsersService>;

  beforeEach(() => {
    authApiSpy = jasmine.createSpyObj('AuthApi', ['login', 'register', 'logout', 'getCurrentUser']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertSpy = jasmine.createSpyObj('AlertService', ['show']);
    usersSpy = jasmine.createSpyObj('UsersService', ['getProfile', 'currentUser', 'clearCache']);

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
});
