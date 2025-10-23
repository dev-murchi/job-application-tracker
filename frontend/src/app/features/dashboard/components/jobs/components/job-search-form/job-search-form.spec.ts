import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobSearchForm } from './job-search-form';
import { JobStatus } from '../../../../../../shared/types/job-status';
import { JobType } from '../../../../../../shared/types/job-type';
import { JobSortOption } from '../../../../../../shared/types/job-sort-option';
import { CustomInputMock } from '../../../../../../../mocks/components/shared/components/form-items/input/input-mock';
import { SvgComponentMock } from '../../../../../../../mocks/components/shared/components/svg/svg-mock';
import { CustomInput } from '../../../../../../shared/components/form-items/input/input';
import { SvgComponent } from '../../../../../../shared/components/svg/svg';

describe('JobSearchForm', () => {
  let component: JobSearchForm;
  let fixture: ComponentFixture<JobSearchForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobSearchForm],
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(JobSearchForm, {
        remove: { imports: [SvgComponent, CustomInput] },
        add: { imports: [SvgComponentMock, CustomInputMock] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JobSearchForm);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('debounceDelay', 500);
    fixture.componentRef.setInput('initialSearchText', '');
    fixture.componentRef.setInput('initialJobStatus', JobStatus.All);
    fixture.componentRef.setInput('initialJobType', JobType.All);
    fixture.componentRef.setInput('initialSortOption', JobSortOption.Newest);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
