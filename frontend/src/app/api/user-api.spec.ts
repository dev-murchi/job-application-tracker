import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UserApi } from './user-api';

describe('UserApi', () => {
  let service: UserApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    service = TestBed.inject(UserApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
