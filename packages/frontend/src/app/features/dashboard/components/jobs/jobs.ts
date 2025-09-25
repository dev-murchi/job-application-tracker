import { Component, inject, DestroyRef } from '@angular/core';
import { JobsService } from '../../../../core/services/jobs';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { JobQuery } from '../../../../shared/types/job-query.data';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-jobs',
  imports: [Pagination],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css'
})
export class Jobs {
  private readonly jobsService = inject(JobsService);

  private activeRoute = inject(ActivatedRoute);
  private router = inject(Router);

  private searchQuery: JobQuery = {};

  data = this.jobsService.queryResult;

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.activeRoute.queryParams
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(params => {
        this.searchQuery = { ...params } as JobQuery;
        this.jobsService.getAll(this.searchQuery);
      });
  }

  requestedPageHandler(pageNumber: number) {
    const queryParams = { ...this.searchQuery, page: pageNumber };
    this.router.navigate([], {
      relativeTo: this.activeRoute,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
}
