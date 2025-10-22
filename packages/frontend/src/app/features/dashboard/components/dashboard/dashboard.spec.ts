import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';
import { JobsService } from '../../../../core/services/jobs';
import { LoadingSpinnerMock } from '../../../../../mocks/components/shared/components/loading-spinner/loading-spinner-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { SvgComponent } from '../../../../shared/components/svg/svg';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    const jobStatisticsSignal = signal({ data: null, isLoading: false, error: null });

    const jobsServiceSpy = jasmine.createSpyObj('JobsService', ['getStatistics'], {
      jobStatistics: jobStatisticsSignal,
    });

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideZonelessChangeDetection(),
        { provide: JobsService, useValue: jobsServiceSpy },
      ],
    })
      .overrideComponent(Dashboard, {
        remove: { imports: [LoadingSpinner, SvgComponent] },
        add: { imports: [LoadingSpinnerMock, SvgComponentMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
