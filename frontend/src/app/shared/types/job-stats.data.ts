export interface MonthlyApplication {
  date: string;
  count: number;
}

export interface JobStats {
  defaultStats: {
    interview: number,
    declined: number,
    pending: number,
    offered: number,
    accepted: number,
  };
  monthlyApplications: { count: number; date: string }[];
}
