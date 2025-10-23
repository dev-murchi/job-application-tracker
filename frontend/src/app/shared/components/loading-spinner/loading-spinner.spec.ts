import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  let component: LoadingSpinner;
  let fixture: ComponentFixture<LoadingSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinner],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
