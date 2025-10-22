import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobStatusBadge } from './job-status-badge';

describe('JobStatusBadge', () => {
  let component: JobStatusBadge;
  let fixture: ComponentFixture<JobStatusBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobStatusBadge],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(JobStatusBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
