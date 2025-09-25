import { JobStatus } from "./job-status";
import { JobType } from "./job-type";

export interface JobDetail {
  _id: string;
  company: string;
  position: string;
  status: JobStatus;
  jobType: JobType;
  jobLocation: string;
  createdBy: string;
}
