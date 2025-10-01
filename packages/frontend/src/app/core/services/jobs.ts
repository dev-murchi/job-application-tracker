import { inject, Injectable, signal, computed } from '@angular/core';
import { JobsApi } from '../../api/jobs-api';
import { filter, tap, take, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { JobDetail } from '../../shared/types/job-detail.data';
import { JobQuery, JobQueryResult } from '../../shared/types/job-query.data';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  private readonly jobsApi = inject(JobsApi);
  private cachedResults = new Map<string, JobQueryResult>();
  private cachedJobs = new Map<string, JobDetail>();

  readonly jobList = signal<{ data: JobQueryResult | null, isLoading: boolean, error: string | null }>({
    data: null,
    isLoading: true,
    error: null
  });

  readonly jobDetail = signal<{ data: JobDetail | null, isLoading: boolean, error: string | null }>({
    data: null,
    isLoading: true,
    error: null
  });

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

  private static removeJobFromCache(cache: Map<string, JobQueryResult>, id: string): Map<string, JobQueryResult> {
    return new Map(
      Array.from(cache.entries())
        .filter(([key, result]) =>
          key !== '{}' && !result.jobs.some(job => job._id === id)
        )
    );
  }

  getJobs(query: JobQuery) {
    const key = this.normalizeQuery(query);
    const cachedResult = this.cachedResults.get(key);

    if (cachedResult) {
      this.jobList.set({ data: cachedResult, isLoading: false, error: null });
      return;
    }

    this.jobList.set({ data: null, isLoading: true, error: null });

    this.jobsApi.getJobs(query)
      .pipe(
        tap(data => console.log({ data })),
        filter((data: JobQueryResult) => (
          data &&
          typeof data.page === 'number' && data.page > 0 &&
          typeof data.totalJobs === 'number' && data.totalJobs >= 0 &&
          typeof data.numOfPages === 'number' && data.numOfPages >= 0
        )),
        catchError(response => {
          console.error(response);
          return of(undefined);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.cachedResults = new Map(this.cachedResults).set(key, data);
          this.jobList.set({ data, isLoading: false, error: null });
        } else {
          this.jobList.set({ data: null, isLoading: false, error: 'No data returned' });
        }
      });
  }

  getJob(id: string) {
    const cachedJob = this.cachedJobs.get(id);

    if(cachedJob) {
      this.jobDetail.set({ data: cachedJob, isLoading: false, error: null });
      return;
    }

    this.jobDetail.set({ data: null, isLoading: true, error: null });

    this.jobsApi.getJob(id).pipe(
      tap(data => console.log({ data })),
      map(data => data.job),
      catchError(response => {
        console.error(response);
        return of(undefined);
      })
    ).subscribe((data) => {
      if (data) {
        this.cachedJobs.set(id, data);
        this.jobDetail.set({ data: data, isLoading: false, error: null });
      } else {
        this.jobDetail.set({ data: null, isLoading: false, error: 'No data returned' });
      }
    });
  }

  create(payload: JobDetail) {
    return this.jobsApi.createJob(payload).pipe(
      tap(data => console.log({ data })),
      take(1),
      catchError(error => {
        console.error(error);
        return of(undefined);
      })
    );
  }

  update(id: string, payload: Partial<JobDetail>) {
    return this.jobsApi.updateJob(id, payload).pipe(
      tap(data => {
        console.log({ data });
        this.cachedResults = JobsService.removeJobFromCache(this.cachedResults, id);
        this.cachedResults.delete('{}');

      }),
      take(1),
      catchError(error => {
        console.error(error);
        return of(undefined);
      })
    );
  }

  delete(id: string) {
    return this.jobsApi.deleteJob(id).pipe(
      tap(data => {
        console.log({ data });
        this.cachedResults = JobsService.removeJobFromCache(this.cachedResults, id);
        this.cachedResults.delete('{}');
      }),
      take(1),
      catchError(error => {
        console.error(error);
        return of(undefined);
      })
    );
  }

}
