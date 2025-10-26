import { Component, input, output } from '@angular/core';
import { JobSortOption } from '../../../../../../../../app/shared/types/job-sort-option';
import { JobStatus } from '../../../../../../../../app/shared/types/job-status';
import { JobType } from '../../../../../../../../app/shared/types/job-type';
import { JobSearchFormOutput } from '../../../../../../../../app/features/dashboard/components/jobs/components/job-search-form/job-search-form';

@Component({
  selector: 'app-job-search-form',
  template: '',
})
export class JobSearchFormMock {
  readonly debounceDelay = input.required<number>();
  readonly initialSearchText = input.required<string>();
  readonly initialJobStatus = input.required<JobStatus>();
  readonly initialJobType = input.required<JobType>();
  readonly initialSortOption = input.required<JobSortOption>();

  readonly jobSearchEvent = output<JobSearchFormOutput>();
}
