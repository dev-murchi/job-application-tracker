import { Component, computed, input } from '@angular/core';
import { JobStatus } from '../../types/job-status';
import { SvgComponent } from "../svg/svg";
import { SvgNameType } from '../../../svg.config';

@Component({
  selector: 'app-job-status-badge',
  imports: [SvgComponent],
  templateUrl: './job-status-badge.html',
  styleUrl: './job-status-badge.css'
})
export class JobStatusBadge {
  status = input<JobStatus>();
  icon = input<SvgNameType>();

  private readonly statusStyles: Partial<Record<JobStatus, { background: string; text: string }>> = {
    [JobStatus.Pending]: { background: 'bg-[var(--color-job-status-pending-bg)]', text: 'text-[var(--color-job-status-pending-text)]' },
    [JobStatus.Interview]: { background: 'bg-[var(--color-job-status-interview-bg)]', text: 'text-[var(--color-job-status-interview-text)]' },
    [JobStatus.Offered]: { background: 'bg-[var(--color-job-status-offered-bg)]', text: 'text-[var(--color-job-status-offered-text)]' },
    [JobStatus.Accepted]: { background: 'bg-[var(--color-job-status-accepted-bg)]', text: 'text-[var(--color-job-status-accepted-text)]' },
    [JobStatus.Declined]: { background: 'bg-[var(--color-job-status-declined-bg)]', text: 'text-[var(--color-job-status-declined-text)]' },
  };

  private readonly defaultStyle = {
    background: 'bg-gray-200',
    text: 'text-gray-800'
  };

  colorCssClass = computed(() => {
    const status = this.status();
    if (!status) return this.defaultStyle;
    return this.statusStyles[status] ?? {
      background: 'bg-[var(--color-job-status-interview-bg)]',
      text: 'text-[var(--color-job-status-interview-text)]',
    };
  });
}
