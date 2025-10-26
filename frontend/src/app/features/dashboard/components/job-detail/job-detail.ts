import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobsService } from '../../../../core/services/jobs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SvgComponent } from '../../../../shared/components/svg/svg';
import { SvgNameType } from '../../../../svg.config';
import { NavLink } from '../../../../shared/components/nav-link/nav-link';
import { AlertService } from '../../../../shared/components/alert/alert-service';
import { JobStatusBadge } from '../../../../shared/components/job-status-badge/job-status-badge';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';
import { JobStatus } from '../../../../shared/types/job-status';

@Component({
  selector: 'app-job-detail',
  imports: [CommonModule, RouterLink, SvgComponent, NavLink, JobStatusBadge, LoadingSpinner],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css',
})
export class JobDetail {
  private readonly jobsService = inject(JobsService);
  private readonly router = inject(Router);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);
  readonly job = this.jobsService.jobDetail;
  readonly backToPageIcon: SvgNameType = 'paginationPrevPageIcon';
  readonly showDeleteConfirm = signal(false);

  readonly statusBadgeIcon = computed(() => {
    const status = this.job().data?.status;

    const statusIcons: Partial<Record<JobStatus, SvgNameType>> = {
      [JobStatus.Pending]: 'pendingActionsIcon',
      [JobStatus.Interview]: 'scheduleIcon',
      [JobStatus.Offered]: 'applicationApprovedIcon',
      [JobStatus.Accepted]: 'checkCircleIcon',
      [JobStatus.Declined]: 'eventRejectedIcon',
    };

    if (status) {
      return statusIcons[status] || 'errorIcon';
    } else {
      return 'errorIcon';
    }
  });

  constructor() {
    this.activeRoute.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params => {
      const id = params.get('jobId');

      if (id) {
        this.jobsService.getJob(id);
      } else {
        this.router.navigate(['/not-found']);
      }
    });

    effect(() => {
      const job = this.job();
      if (job.error) {
        this.router.navigate(['/not-found']);
      } else if (job.operation === 'delete') {
        this.alertService.show('Job application deleted successfully', 'success');
        this.router.navigate(['/dashboard/jobs']);
      } else if (!job.isLoading && !job.data) {
        this.router.navigate(['/not-found']);
      }
    });
  }

  openDeleteConfirmation(): void {
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    const jobId = this.job().data?._id;
    if (jobId) {
      this.jobsService.delete(jobId);
    }
  }
}
