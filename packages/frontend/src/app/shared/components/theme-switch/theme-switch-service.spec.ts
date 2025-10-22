import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeSwitchService } from './theme-switch-service';

describe('ThemeSwitchService', () => {
  let service: ThemeSwitchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ThemeSwitchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
