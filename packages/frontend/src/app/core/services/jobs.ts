import { inject, Injectable, signal, computed } from '@angular/core';
import { JobsApi } from '../../api/jobs-api';
import { filter, tap, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { JobDetail } from '../../shared/types/job-detail.data';
import { JobQuery, JobQueryResult } from '../../shared/types/job-query.data';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  private readonly jobsApi = inject(JobsApi);
  private cachedResults = new Map<string, JobQueryResult>();
  private _queryResult = signal<JobQueryResult | undefined>(undefined);

  readonly queryResult = computed(() => this._queryResult());

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

  getAll(query: JobQuery) {
    const key = this.normalizeQuery(query);
    const cachedResult = this.cachedResults.get(key);

    if (cachedResult) {
      this._queryResult.set(cachedResult);
      return;
    }

    this.jobsApi.getJobs(query)
      .pipe(
        tap(data => console.log({ data })),
        filter((data: JobQueryResult) => (
          data &&
          typeof data.page === 'number' && data.page > 0 &&
          typeof data.totalJobs === 'number' && data.totalJobs >= 0 &&
          typeof data.numOfPages === 'number' && data.numOfPages >= 0
        )),
        take(1),
        catchError(error => {
          console.error(error);
          return of(undefined);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.cachedResults = new Map(this.cachedResults).set(key, data);
          this._queryResult.set(data);
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
