import { TestBed } from '@angular/core/testing';
import { authCanMatchGuard, guestCanMatchGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('auth-guard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['validateAuthStatus']);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
  });

  it('authCanMatchGuard should be defined', () => {
    expect(authCanMatchGuard).toBeTruthy();
  });

  it('guestCanMatchGuard should be defined', () => {
    expect(guestCanMatchGuard).toBeTruthy();
  });
});
