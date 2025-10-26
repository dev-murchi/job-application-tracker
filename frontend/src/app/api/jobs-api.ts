import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JobDetail } from '../shared/types/job-detail.data';
import { Observable } from 'rxjs';
import { JobQuery, JobQueryResult } from '../shared/types/job-query.data';
import { JobStats } from '../shared/types/job-stats.data';

@Injectable({
  providedIn: 'root',
})
export class JobsApi {
  private readonly apiurl = '/api/jobs';
  private readonly http = inject(HttpClient);

  createJob(payload: JobDetail): Observable<{ job: JobDetail }> {
    return this.http.post<{ job: JobDetail }>(`${this.apiurl}`, payload);
  }

  getJobs(query: JobQuery = {} as JobQuery): Observable<JobQueryResult> {
    const { status, jobType, sort, search, page, limit } = query;

    const params = {
      ...(status && { status }),
      ...(jobType && { jobType }),
      ...(sort && { sort }),
      ...(search && { search }),
      ...(page && { page }),
      ...(limit && { limit }),
    };

    return this.http.get<JobQueryResult>(`${this.apiurl}`, {
      params: params,
    });
  }

  updateJob(jobId: string, payload: Partial<JobDetail>): Observable<{ job: JobDetail }> {
    return this.http.patch<{ job: JobDetail }>(`${this.apiurl}/${jobId}`, payload);
  }

  deleteJob(jobId: string): Observable<JobDetail> {
    return this.http.delete<JobDetail>(`${this.apiurl}/${jobId}`);
  }

  getJobStatistics(): Observable<JobStats> {
    return this.http.get<JobStats>(`${this.apiurl}/stats`);
  }

  getJob(id: string): Observable<{ job: JobDetail }> {
    return this.http.get<{ job: JobDetail }>(`${this.apiurl}/${id}`);
  }
}
