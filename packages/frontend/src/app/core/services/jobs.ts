import { inject, Injectable, signal, computed } from '@angular/core';
import { JobsApi } from '../../api/jobs-api';
import { filter, tap, take, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { JobDetail } from '../../shared/types/job-detail.data';
import { JobQuery, JobQueryResult } from '../../shared/types/job-query.data';
import { JobStats } from '../../shared/types/job-stats.data';

interface LoadingState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface JobDetailState extends LoadingState<JobDetail> {
  operation: 'fetch' | 'create' | 'update' | null;
}

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private readonly jobsApi = inject(JobsApi);

  private readonly cacheState = {
    searchQueryResults: new Map<string, JobQueryResult>(),
    jobs: new Map<string, JobDetail>(),
    statistics: null as JobStats | null
  };

  private readonly initialJobListState: LoadingState<JobQueryResult> = {
    data: null,
    isLoading: true,
    error: null
  };

  private readonly initialJobDetailState: JobDetailState = {
    data: null,
    isLoading: true,
    error: null,
    operation: null
  };

  private readonly initialJobStatisticsState: LoadingState<JobStats> = {
    data: null,
    isLoading: false,
    error: null
  };

  readonly #jobList = signal<LoadingState<JobQueryResult>>(this.initialJobListState);
  readonly #jobStatistics = signal<LoadingState<JobStats>>(this.initialJobStatisticsState);
  readonly #jobDetail = signal<JobDetailState>(this.initialJobDetailState);

  readonly jobList = this.#jobList.asReadonly();
  readonly jobStatistics = this.#jobStatistics.asReadonly();
  readonly jobDetail = this.#jobDetail.asReadonly();

  private static sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(JobsService.sortKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key: string) => ({
          ...result,
          [key]: JobsService.sortKeys(obj[key])
        }), {});
    }
    return obj;
  }


  private normalizeQuery(query: JobQuery): string {
    return JSON.stringify(JobsService.sortKeys(query));
  }

  private updateJobListState(update: Partial<LoadingState<JobQueryResult>>): void {
    this.#jobList.update((old) => ({ ...old, ...update }));
  }

  private updateJobDetailState(update: Partial<JobDetailState>): void {
    this.#jobDetail.update((old) => ({ ...old, ...update }));
  }

  private updateJobStatisticsState(update: Partial<LoadingState<JobStats>>): void {
    this.#jobStatistics.update((old) => ({ ...old, ...update }));
  }

  private getCachedQueryResult(key: string): JobQueryResult | undefined {
    return this.cacheState.searchQueryResults.get(key);
  }

  private setCachedQueryResult(key: string, data: JobQueryResult): void {
    this.cacheState.searchQueryResults = new Map(this.cacheState.searchQueryResults).set(key, data);
  }

  private getCachedJob(id: string): JobDetail | undefined {
    return this.cacheState.jobs.get(id);
  }

  private setCachedJob(id: string, job: JobDetail): void {
    this.cacheState.jobs = new Map(this.cacheState.jobs).set(id, job);
  }

  private deleteCachedJob(id: string): void {
    const newMap = new Map(this.cacheState.jobs);
    newMap.delete(id);
    this.cacheState.jobs = newMap;
  }

  private getCachedStatistics(): JobStats | null {
    return this.cacheState.statistics;
  }

  private setCachedStatistics(stats: JobStats | null): void {
    this.cacheState.statistics = stats;
  }

  private invalidateJobRelatedCaches(jobId?: string): void {
    this.setCachedStatistics(null);
    if (jobId) {
      this.removeJobFromQueryCache(jobId);
    }
  }
  private removeJobFromQueryCache(jobId: string): void {
    const filteredEntries = Array.from(this.cacheState.searchQueryResults.entries())
      .filter(([key, result]) =>
        key !== '{}' && !result.jobs.some(job => job._id === jobId)
      );

    this.cacheState.searchQueryResults = new Map(filteredEntries);
    this.cacheState.searchQueryResults.delete('{}');
  }


  getJobs(query: JobQuery): void {
    const key = this.normalizeQuery(query);
    const cachedResult = this.getCachedQueryResult(key);

    if (cachedResult) {
      this.updateJobListState({ data: cachedResult, isLoading: false, error: null });
      return;
    }

    this.updateJobListState({ data: null, isLoading: true, error: null });

    this.jobsApi.getJobs(query)
      .pipe(
        tap(data => console.log({ jobsData: data })),
        filter((data: JobQueryResult) => this.isValidJobQueryResult(data)),
        catchError(() => {
          this.updateJobListState({ data: null, isLoading: false, error: 'Failed to load jobs' });
          return of(undefined);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.setCachedQueryResult(key, data);
          this.updateJobListState({ data, isLoading: false, error: null });
        }
      });
  }

  getJob(id: string): void {
    const cachedJob = this.getCachedJob(id);

    if (cachedJob) {
      this.updateJobDetailState({ data: cachedJob, isLoading: false, error: null, operation: 'fetch' });
      return;
    }

    this.updateJobDetailState({ data: null, isLoading: true, error: null, operation: 'fetch' });

    this.jobsApi.getJob(id).pipe(
      tap(data => console.log({ getJobData: data })),
      map(response => response.job),
      catchError(error => {
        console.error('Failed to get job:', error);
        this.updateJobDetailState({ data: null, isLoading: false, error: 'Failed to load job', operation: 'fetch' });
        return of(undefined);
      })
    ).subscribe((job) => {
      if (job) {
        this.setCachedJob(id, job);
        this.updateJobDetailState({ data: job, isLoading: false, error: null, operation: 'fetch' });
      }
    });
  }

  create(payload: JobDetail): void {
    this.updateJobDetailState({ data: null, isLoading: true, error: null, operation: 'create' });

    this.jobsApi.createJob(payload).pipe(
      tap(data => console.log({ createJobData: data })),
      map(response => response.job),
      catchError(error => {
        console.error('Failed to create job:', error);
        this.updateJobDetailState({
          data: null,
          isLoading: false,
          error: 'Failed to create job',
          operation: 'create'
        });
        return of(undefined);
      })
    ).subscribe((job) => {
      if (job) {
        if (job._id) {
          this.invalidateJobRelatedCaches();
          this.updateJobDetailState({ data: job, isLoading: false, error: null, operation: 'create' });
        } else {
          this.updateJobDetailState({
            data: null,
            isLoading: false,
            error: 'Job created but no ID returned',
            operation: 'create'
          });
        }
      }
    });
  }

  update(id: string, payload: Partial<JobDetail>): void {
    this.updateJobDetailState({ data: null, isLoading: true, error: null, operation: 'update' });

    this.jobsApi.updateJob(id, payload).pipe(
      tap(data => console.log({ updateJobData: data })),
      map(response => response.job),
      catchError(error => {
        console.error('Failed to update job:', error);
        this.updateJobDetailState({
          data: null,
          isLoading: false,
          error: 'Failed to update job',
          operation: 'update'
        });
        return of(undefined);
      })
    ).subscribe((job) => {
      if (job) {
        this.invalidateJobRelatedCaches(id);
        this.setCachedJob(id, job);
        this.updateJobDetailState({ data: job, isLoading: false, error: null, operation: 'update' });
      }
    });
  }

  delete(id: string): void {
    this.jobsApi.deleteJob(id).pipe(
      tap(data => console.log({ deleteJobData: data })),
      take(1),
      catchError(error => {
        console.error('Failed to delete job:', error);
        return of(undefined);
      })
    ).subscribe((data) => {
      if (data) {
        this.invalidateJobRelatedCaches(id);
        this.deleteCachedJob(id);
      }
    });
  }

  getStatistics(): void {
    const cachedStats = this.getCachedStatistics();

    if (cachedStats) {
      this.updateJobStatisticsState({ data: cachedStats, isLoading: false, error: null });
      return;
    }

    this.updateJobStatisticsState({ data: cachedStats, isLoading: true, error: null });

    this.jobsApi.getJobStatistics().pipe(
      tap(data => console.log({ statisticsData: data })),
      catchError(error => {
        console.error('Failed to fetch job statistics:', error);
        this.updateJobStatisticsState({
          data: cachedStats,
          isLoading: false,
          error: 'Failed to fetch job statistics'
        });
        return of(undefined);
      })
    ).subscribe((stats) => {
      if (stats) {
        this.setCachedStatistics(stats);
        this.updateJobStatisticsState({ data: stats, isLoading: false, error: null });
      }
    });
  }

  clearAllCaches(): void {
    this.cacheState.searchQueryResults = new Map();
    this.cacheState.jobs = new Map();
    this.cacheState.statistics = null;

    this.#jobList.set(this.initialJobListState);
    this.#jobDetail.set(this.initialJobDetailState);
    this.#jobStatistics.set(this.initialJobStatisticsState);
  }

  private isValidJobQueryResult(data: JobQueryResult): boolean {
    return !!(data &&
      typeof data.page === 'number' && data.page > 0 &&
      typeof data.totalJobs === 'number' && data.totalJobs >= 0 &&
      typeof data.numOfPages === 'number' && data.numOfPages >= 0
    );
  }

}
