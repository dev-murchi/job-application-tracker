import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';

import { Jobs } from './jobs';
import { JobsService } from '../../../../core/services/jobs';
import { JobSearchFormMock } from '../../../../../mocks/components/features/dashboard/components/jobs/components/job-search-form/job-search-form-mock';
import { JobStatusBadgeMock } from '../../../../../mocks/components/shared/components/job-status-badge/job-status-badge-mock';
import { LoadingSpinnerMock } from '../../../../../mocks/components/shared/components/loading-spinner/loading-spinner-mock';
import { PaginationMock } from '../../../../../mocks/components/shared/components/pagination/pagination-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { JobStatusBadge } from '../../../../shared/components/job-status-badge/job-status-badge';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { JobSearchForm } from './components/job-search-form/job-search-form';
import { provideRouter } from '@angular/router';

describe('Jobs', () => {
  let component: Jobs;
  let fixture: ComponentFixture<Jobs>;

  beforeEach(async () => {
    const jobListSignal = signal({ data: null, isLoading: false, error: null });

    const spy = jasmine.createSpyObj('JobsService', ['getJobs'], {
      jobList: jobListSignal,
    });

    await TestBed.configureTestingModule({
      imports: [Jobs],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: JobsService, useValue: spy },
      ],
    })
      .overrideComponent(Jobs, {
        remove: {
          imports: [Pagination, JobSearchForm, SvgComponent, JobStatusBadge, LoadingSpinner],
        },
        add: {
          imports: [
            PaginationMock,
            JobSearchFormMock,
            SvgComponentMock,
            JobStatusBadgeMock,
            LoadingSpinnerMock,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Jobs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
