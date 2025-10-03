import { JobStatus } from "./job-status";


export interface MonthlyApplication {
  date: string;
  count: number;
}

export interface JobStats {
  defaultStats: {
    [K in JobStatus]: number;
  };
  monthlyApplications: { count: number; date: string }[];
}
