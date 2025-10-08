import { computed, inject, Injectable, signal } from '@angular/core';
import { JobsApi } from '../../api/jobs-api';
import { filter, tap, take, catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { JobDetail } from '../../shared/types/job-detail.data';
import { JobQuery, JobQueryResult } from '../../shared/types/job-query.data';
import { initialJobsState, JobsState } from '../../jobs-state.data';
import { JobsHelper } from '../../shared/utils/jobs-helper';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private readonly jobsApi = inject(JobsApi);


  readonly #state = signal<JobsState>(initialJobsState);

  readonly jobList = computed(() => this.#state().queryResult);
  readonly jobStatistics = computed(() => this.#state().statistics);
  readonly jobDetail = computed(() => this.#state().detail);

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL;
  }

  getJobs(query: JobQuery): void {
    const key = JobsHelper.normalizeQuery(query);
    const cached = this.#state().caches.queries.get(key);

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.#state.update((s) => ({
        ...s,
        queryResult: { data: cached.data, isLoading: false, error: null },
      }));
      return;
    }

    this.#state.update((s) => ({
      ...s,
      queryResult: { data: s.queryResult.data, isLoading: true, error: null },
    }));

    this.jobsApi.getJobs(query)
      .pipe(
        filter((data: JobQueryResult) => this.isValidJobSearchQueryResult(data)),
        tap((data) => {
          this.#state.update((s) => ({
            ...s,
            queryResult: { data, isLoading: false, error: null },
            caches: {
              ...s.caches,
              queries: new Map(s.caches.queries).set(key, { data, timestamp: Date.now() }),
            },
          }));
        }),
        catchError((err) => this.handleError('queryResult', 'Failed to load jobs', err)),
        map(() => undefined) // Return void
      )
      .subscribe();
  }

  getJob(id: string): void {
    const cached = this.#state().caches.jobs.get(id);

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.#state.update((s) => ({
        ...s,
        detail: { data: cached.data, isLoading: false, error: null, operation: 'fetch' },
      }));
      return;
    }

    this.#state.update((s) => ({
      ...s,
      detail: { data: null, isLoading: true, error: null, operation: 'fetch' },
    }));

    this.jobsApi.getJob(id).pipe(
      map(response => response.job),
      tap((job) => {
        this.#state.update((s) => ({
          ...s,
          detail: { data: job, isLoading: false, error: null, operation: 'fetch' },
          caches: JobsHelper.withUpdatedJobCache(s.caches, job),
        }));
      }),
      catchError((err) => this.handleError('detail', 'Failed to load job', err)),
      map(() => undefined)
    ).subscribe();
  }

  create(payload: JobDetail): void {
    this.#state.update((s) => ({
      ...s,
      detail: { data: null, isLoading: true, error: null, operation: 'create' },
    }));

    this.jobsApi.createJob(payload).pipe(
      map(response => response.job),
     tap((job) => {
        this.#state.update((s) => ({
          ...s,
          detail: { data: job, isLoading: false, error: null, operation: 'create' },
          caches: JobsHelper.withInvalidatedListCaches(s.caches), // Invalidate all list-related caches
        }));
      }),
      catchError((err) => this.handleError('detail', 'Failed to create job', err)),
      map(() => undefined)
    ).subscribe();
  }

  update(id: string, payload: Partial<JobDetail>): void {
     this.#state.update((s) => ({
      ...s,
      detail: { data: null, isLoading: true, error: null, operation: 'update' },
    }));

    this.jobsApi.updateJob(id, payload).pipe(
      map(response => response.job),
      tap((job) => {
        this.#state.update((s) => ({
          ...s,
          detail: { data: job, isLoading: false, error: null, operation: 'update' },
          caches: JobsHelper.withInvalidatedListCaches(JobsHelper.withUpdatedJobCache(s.caches, job)),
        }));
      }),
      catchError((err) => this.handleError('detail', 'Failed to update job', err)),
       map(() => undefined)
    ).subscribe();
  }

  delete(id: string): void {
    this.#state.update((s) => ({
      ...s,
      detail: { data: null, isLoading: true, error: null, operation: 'delete' },
    }));
    this.jobsApi.deleteJob(id).pipe(
      tap(() => {
        this.#state.update((s) => ({
          ...s,
          detail: { data: null, isLoading: false, error: null, operation: 'delete' },
          caches: JobsHelper.withRemovedJobCache(s.caches, id),
        }));
      }),
      catchError((err) => this.handleError('detail', 'Failed to delete job', err)),
      map(() => undefined)
    ).subscribe();
  }

  getStatistics(): void {
    const cached = this.#state().caches.statistics;
    if (cached) {
      this.#state.update((s) => ({
        ...s,
        statistics: {data: cached.data, isLoading: false, error: null}
      }))
      return;
    }

     this.#state.update((s) => ({
        ...s,
        statistics: {data: s.statistics.data, isLoading: true, error: null}
      }));

    this.jobsApi.getJobStatistics().pipe(
      tap((stats)=> {
        this.#state.update((s) => ({
          ...s,
          statistics: { data: stats, isLoading: false, error: null }
        }))
      }),
      catchError((err) => this.handleError('detail', 'Failed to fetch job statistics', err)),
    ).subscribe();
  }

  clearAllState(): void {
    this.#state.set(initialJobsState);
  }

  private handleError(
    slice: 'queryResult' | 'detail' | 'statistics',
    message: string,
    error: any
  ): Observable<void> {
    console.error(message, error);
    this.#state.update((s) => ({
      ...s,
      [slice]: { ...s[slice], isLoading: false, error: message },
    }));
    return of(undefined);
  }


  private isValidJobSearchQueryResult(data: JobQueryResult): boolean {
    return !!(data &&
      typeof data.page === 'number' && data.page > 0 &&
      typeof data.totalJobs === 'number' && data.totalJobs >= 0 &&
      typeof data.numOfPages === 'number' && data.numOfPages >= 0
    );
  }

}
