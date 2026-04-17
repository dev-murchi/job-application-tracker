import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth';
import { UsersService } from '../services/users';

describe('authInterceptor', () => {
  let usersSpy: jasmine.SpyObj<UsersService>;
  let isAuthenticatingSpy: jasmine.Spy<() => boolean>;

  beforeEach(() => {
    usersSpy = jasmine.createSpyObj('UsersService', ['setAsGuest']);
    isAuthenticatingSpy = jasmine.createSpy('isAuthenticating').and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: UsersService, useValue: usersSpy },
        { provide: AuthService, useValue: { isAuthenticating: isAuthenticatingSpy } },
      ],
    });
  });

  const runInterceptor = (
    handler: HttpInterceptorFn,
    nextFn: jasmine.Spy,
  ): ReturnType<HttpInterceptorFn> =>
    TestBed.runInInjectionContext(() => handler({} as Parameters<HttpInterceptorFn>[0], nextFn));

  it('calls setAsGuest and re-throws on 401 when not authenticating', done => {
    const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const next = jasmine.createSpy().and.returnValue(throwError(() => err));

    runInterceptor(authInterceptor, next).subscribe({
      error: (e: unknown) => {
        expect(usersSpy.setAsGuest).toHaveBeenCalledTimes(1);
        expect(e).toBe(err);
        done();
      },
    });
  });

  it('does NOT call setAsGuest on 401 when isAuthenticating is true', done => {
    isAuthenticatingSpy.and.returnValue(true);
    const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const next = jasmine.createSpy().and.returnValue(throwError(() => err));

    runInterceptor(authInterceptor, next).subscribe({
      error: (e: unknown) => {
        expect(usersSpy.setAsGuest).not.toHaveBeenCalled();
        expect(e).toBe(err);
        done();
      },
    });
  });

  it('does NOT call setAsGuest and re-throws on non-401 error', done => {
    const err = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const next = jasmine.createSpy().and.returnValue(throwError(() => err));

    runInterceptor(authInterceptor, next).subscribe({
      error: (e: unknown) => {
        expect(usersSpy.setAsGuest).not.toHaveBeenCalled();
        expect(e).toBe(err);
        done();
      },
    });
  });

  it('passes successful responses through without side effects', done => {
    const response = { status: 200 };
    const next = jasmine.createSpy().and.returnValue(of(response));

    runInterceptor(authInterceptor, next).subscribe({
      next: (res: unknown) => {
        expect(res).toBe(response);
        expect(usersSpy.setAsGuest).not.toHaveBeenCalled();
      },
      complete: () => done(),
    });
  });
});
