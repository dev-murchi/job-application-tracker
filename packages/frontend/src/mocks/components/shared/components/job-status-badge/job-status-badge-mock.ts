import { Component, input } from '@angular/core';
import { JobStatus } from '../../../../../app/shared/types/job-status';
import { SvgNameType } from '../../../../../app/svg.config';

@Component({
  selector: 'app-job-status-badge',
  template: '',
})
export class JobStatusBadgeMock {
  status = input<JobStatus>();
  icon = input<SvgNameType>();
}
