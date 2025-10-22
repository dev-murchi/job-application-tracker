import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { JobsApi } from './jobs-api';

describe('JobsApi', () => {
  let service: JobsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobsApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(JobsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
