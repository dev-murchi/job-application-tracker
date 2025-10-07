import { Component, inject, DestroyRef, signal } from '@angular/core';
import { JobsService } from '../../../../core/services/jobs';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { JobQuery } from '../../../../shared/types/job-query.data';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JobSearchForm, JobSearchFormOutput } from "./components/job-search-form/job-search-form";
import { JobStatus } from '../../../../shared/types/job-status';
import { JobType } from '../../../../shared/types/job-type';
import { JobSortOption } from '../../../../shared/types/job-sort-option';
import { SvgComponent } from "../../../../shared/components/svg/svg";
import { JobStatusBadge } from "../../../../shared/components/job-status-badge/job-status-badge";
import { LoadingSpinner } from "../../../../shared/components/loading-spinner/loading-spinner";

@Component({
  selector: 'app-jobs',
  imports: [Pagination, JobSearchForm, RouterLink, SvgComponent, JobStatusBadge, LoadingSpinner],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css'
})
export class Jobs {
  private readonly jobsService = inject(JobsService);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly jobList = this.jobsService.jobList;
  readonly initialSearchText = signal('');
  readonly initialJobStatus = signal(JobStatus.All);
  readonly initialJobType = signal(JobType.All);
  readonly initialSortOption = signal(JobSortOption.Newest);
  readonly searchFormDebounce = signal(500);
  private searchQuery: JobQuery = {};

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.activeRoute.queryParams
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(params => {
        this.searchQuery = this.mapParamsToQuery(params);
        this.updateJobSearchFormSignals(params);
        this.jobsService.getJobs(this.searchQuery);
      });
  }

  private mapParamsToQuery(params: any): JobQuery {
    return {
      ...(params.search && { search: params.search }),
      ...(params.sort && { sort: params.sort }),
      ...(params.status && { status: params.status }),
      ...(params.jobType && { jobType: params.jobType }),
      ...(params.page && { page: params.page }),
      ...(params.limit && { limit: params.limit }),
    }
  }

  private updateJobSearchFormSignals(params: any) {
    const { search, status, jobType, sort } = params;

    this.initialSearchText.set(search || '');
    this.initialSortOption.set(sort && Object.values(JobSortOption).includes(sort) ? sort : JobSortOption.Newest);
    this.initialJobStatus.set(status && Object.values(JobStatus).includes(status) ? status : JobStatus.All);
    this.initialJobType.set(jobType && Object.values(JobType).includes(jobType) ? jobType : JobType.All);
  }

  private updateQueryParams(queryParams: JobQuery) {
    this.router.navigate([], {
      relativeTo: this.activeRoute,
      queryParams,
    });
  }

  requestedPageHandler(pageNumber: number) {
    this.updateQueryParams({ ...this.searchQuery, page: pageNumber });
  }

  handleSearchFormData(event: JobSearchFormOutput) {
    const query: JobQuery = {
      search: event.value.search,
      status: event.value.status,
      jobType: event.value.type,
      sort: event.value.sort
    };

    const queryParams = event.operation === 'search' ? query : null;
    this.updateQueryParams(queryParams as any);
  }

}
