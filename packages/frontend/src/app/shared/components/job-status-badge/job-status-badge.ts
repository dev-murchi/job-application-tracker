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
    [JobStatus.Pending]:   { background: 'bg-[var(--bg-job-status-pending)]',   text: 'text-[var(--text-job-status-pending)]' },
    [JobStatus.Interview]: { background: 'bg-[var(--bg-job-status-interview)]', text: 'text-[var(--text-job-status-interview)]' },
    [JobStatus.Offered]:   { background: 'bg-[var(--bg-job-status-offered)]',   text: 'text-[var(--text-job-status-offered)]' },
    [JobStatus.Accepted]:  { background: 'bg-[var(--bg-job-status-accepted)]',  text: 'text-[var(--text-job-status-accepted)]' },
    [JobStatus.Declined]:  { background: 'bg-[var(--bg-job-status-declined)]',  text: 'text-[var(--text-job-status-declined)]' },
  };

  private readonly defaultStyle = {
    background: 'bg-gray-200',
    text: 'text-gray-800'
  };

  colorCssClass = computed(() => {
    const status = this.status();
    if (!status) return this.defaultStyle;
    return this.statusStyles[status] ?? {
      background: 'bg-[var(--bg-job-status-interview)]',
      text: 'text-[var(--text-job-status-interview)]',
    };
  });
}
