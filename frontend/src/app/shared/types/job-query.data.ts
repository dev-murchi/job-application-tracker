import { JobDetail } from './job-detail.data';
import { JobStatus } from './job-status';
import { JobType } from './job-type';

export interface JobQuery {
  status?: JobStatus;
  jobType?: JobType;
  sort?: any;
  search?: string;
  page?: number;
  limit?: number;
}
export interface JobQueryResult {
  jobs: JobDetail[];
  page: number;
  numOfPages: number;
  totalJobs: number;
}
