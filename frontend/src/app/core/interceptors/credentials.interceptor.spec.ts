import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { credentialsInterceptor } from './credentials.interceptor';

describe('credentialsInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  const run = (
    req: HttpRequest<unknown>,
    nextFn: jasmine.Spy,
  ): ReturnType<typeof credentialsInterceptor> =>
    TestBed.runInInjectionContext(() => credentialsInterceptor(req, nextFn));

  it('forwards the request with withCredentials: true', done => {
    const req = new HttpRequest('GET', '/api/test');
    const next = jasmine.createSpy().and.callFake((r: HttpRequest<unknown>) => of(r));

    run(req, next).subscribe({
      complete: () => {
        const forwarded = next.calls.mostRecent().args[0] as HttpRequest<unknown>;
        expect(forwarded.withCredentials).toBeTrue();
        done();
      },
    });
  });

  it('does not mutate the original request object', done => {
    const req = new HttpRequest('POST', '/api/auth/login', {});
    const next = jasmine.createSpy().and.callFake((r: HttpRequest<unknown>) => of(r));

    run(req, next).subscribe({
      complete: () => {
        expect(req.withCredentials).toBeFalse();
        done();
      },
    });
  });

  it('passes the response through unmodified', done => {
    const req = new HttpRequest('GET', '/api/test');
    const response = { data: 'ok' };
    const next = jasmine.createSpy().and.returnValue(of(response));

    run(req, next).subscribe({
      next: (res: unknown) => {
        expect(res).toBe(response);
      },
      complete: () => done(),
    });
  });
});
