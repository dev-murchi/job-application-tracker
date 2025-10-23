import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobForm } from './job-form';
import { SubmitButtonMock } from '../../../../../mocks/components/shared/components/buttons/submit-button/submit-button-mock';
import { CustomInputMock } from '../../../../../mocks/components/shared/components/form-items/input/input-mock';
import { LoadingSpinnerMock } from '../../../../../mocks/components/shared/components/loading-spinner/loading-spinner-mock';
import { NavLinkComponentMock } from '../../../../../mocks/components/shared/components/nav-link/nav-link-mock';
import { SvgComponentMock } from '../../../../../mocks/components/shared/components/svg/svg-mock';
import { SubmitButton } from '../../../../shared/components/buttons/submit-button/submit-button';
import { CustomInput } from '../../../../shared/components/form-items/input/input';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { NavLink } from '../../../../shared/components/nav-link/nav-link';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { JobsService } from '../../../../core/services/jobs';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { provideRouter } from '@angular/router';

describe('JobForm', () => {
  let component: JobForm;
  let fixture: ComponentFixture<JobForm>;
  let jobsServiceSpy: jasmine.SpyObj<JobsService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    const jobDetailSignal = signal({ data: null, isLoading: false, error: null, operation: null });

    jobsServiceSpy = jasmine.createSpyObj('JobsService', ['getJob', 'update', 'create'], {
      jobDetail: jobDetailSignal,
    });

    alertServiceSpy = jasmine.createSpyObj('AlertService', ['show']);

    await TestBed.configureTestingModule({
      imports: [JobForm],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: JobsService, useValue: jobsServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
      ],
    })
      .overrideComponent(JobForm, {
        remove: { imports: [SubmitButton, CustomInput, NavLink, SvgComponent, LoadingSpinner] },
        add: {
          imports: [
            SubmitButtonMock,
            CustomInputMock,
            NavLinkComponentMock,
            SvgComponentMock,
            LoadingSpinnerMock,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JobForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
