import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SvgService } from './svg-service';

describe('SvgService', () => {
  let service: SvgService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SvgService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });

    service = TestBed.inject(SvgService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('de-dupes in-flight requests for the same icon', () => {
    let v1: string | null | undefined;
    let v2: string | null | undefined;

    service.getSvg$('errorIcon').subscribe(v => (v1 = v));
    service.getSvg$('errorIcon').subscribe(v => (v2 = v));

    const reqs = httpMock.match('images/error-icon.svg');
    expect(reqs.length).toBe(1);

    reqs[0].flush('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    expect(v1).not.toBeNull();
    expect(v1 ?? '').toContain('<svg');
    expect(v1).toBe(v2);
  });

  it('caches the resolved SVG', () => {
    let v: string | null | undefined;

    service.getSvg$('errorIcon').subscribe(value => (v = value));

    const req = httpMock.expectOne('images/error-icon.svg');
    req.flush('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    expect(v).not.toBeNull();
    expect(v ?? '').toContain('<svg');

    service.getSvg$('errorIcon').subscribe();
    httpMock.expectNone('images/error-icon.svg');
  });

  it('returns null for non-SVG documents', () => {
    let v: string | null | undefined;

    service.getSvg$('errorIcon').subscribe(value => (v = value));

    const req = httpMock.expectOne('images/error-icon.svg');
    req.flush('<html><body><svg></svg></body></html>');

    expect(v).toBeNull();
  });

  it('strips obvious active content before DOM injection', () => {
    let v: string | null | undefined;

    service.getSvg$('errorIcon').subscribe(value => (v = value));

    const req = httpMock.expectOne('images/error-icon.svg');
    req.flush(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)">
        <script>alert(1)</script>
        <foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject>
        <a href=" javascript:alert(1)">x</a>
        <use xlink:href="javascript:alert(1)" />
        <rect onclick="alert(1)" />
      </svg>
    `);

    expect(v).not.toBeNull();
    expect(v ?? '').toContain('<svg');
    expect(v).not.toContain('<script');
    expect(v).not.toContain('foreignObject');
    expect(v).not.toContain('onload');
    expect(v).not.toContain('onclick');
    expect(v?.toLowerCase()).not.toContain('javascript:');
  });
});
