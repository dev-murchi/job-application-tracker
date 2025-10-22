import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDetail } from './job-detail';
import { JobsService } from '../../../../core/services/jobs';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { JobStatusBadgeMock } from '../../../../../mocks/components/shared/components/job-status-badge/job-status-badge-mock';
import { LoadingSpinnerMock } from '../../../../../mocks/components/shared/components/loading-spinner/loading-spinner-mock';
import { NavLinkComponentMock } from '../../../../../mocks/components/shared/components/nav-link/nav-link-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { JobStatusBadge } from '../../../../shared/components/job-status-badge/job-status-badge';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { NavLink } from '../../../../shared/components/nav-link/nav-link';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

describe('JobDetail', () => {
  let component: JobDetail;
  let fixture: ComponentFixture<JobDetail>;
  let jobsServiceSpy: jasmine.SpyObj<JobsService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let routeParamMap: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create a signal for jobDetail
    const jobDetailSignal = signal({
      data: null,
      isLoading: false,
      error: null,
      operation: null,
    });

    jobsServiceSpy = jasmine.createSpyObj('JobsService', ['getJob', 'delete'], {
      jobDetail: jobDetailSignal,
    });

    alertServiceSpy = jasmine.createSpyObj('AlertService', ['show']);

    routeParamMap = new BehaviorSubject({
      get: (key: string) => (key === 'jobId' ? 'job-123' : null),
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [JobDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: JobsService, useValue: jobsServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParamMap.asObservable(),
          },
        },
      ],
    })
      .overrideComponent(JobDetail, {
        remove: { imports: [SvgComponent, NavLink, JobStatusBadge, LoadingSpinner] },
        add: {
          imports: [SvgComponentMock, NavLinkComponentMock, JobStatusBadgeMock, LoadingSpinnerMock],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JobDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
