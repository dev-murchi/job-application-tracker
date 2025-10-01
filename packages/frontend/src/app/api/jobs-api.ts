import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JobDetail } from '../shared/types/job-detail.data';
import { Observable } from 'rxjs';
import { JobQuery, JobQueryResult } from '../shared/types/job-query.data';

@Injectable({
  providedIn: 'root'
})
export class JobsApi {
  private readonly apiurl = '/api/jobs';
  private readonly http = inject(HttpClient);

  createJob(payload: JobDetail) {
    return this.http.post<JobDetail>(`${this.apiurl}`, payload);
  }

  getJobs(query?: JobQuery): Observable<JobQueryResult> {
    const params: any = {};
    if (query?.status) params.status = query.status;
    if (query?.jobType) params.jobType = query.jobType;
    if (query?.sort) params.sort = query.sort;
    if (query?.search) params.search = query.search;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;

    return this.http.get<JobQueryResult>(`${this.apiurl}`, {
      params: params
    })
  }

  updateJob(jobId: string, payload: Partial<JobDetail>) {
    return this.http.patch<JobDetail>(`${this.apiurl}/${jobId}`, payload);
  }

  deleteJob(jobId: string) {
    return this.http.delete<JobDetail>(`${this.apiurl}/${jobId}`);
  }

  getJobStatistics() {
    return this.http.get<JobDetail>(`${this.apiurl}/stats`);
  }
  getJob(id: string) {
    return this.http.get<{ job: JobDetail }>(`${this.apiurl}/${id}`);
  }
}
