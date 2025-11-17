import { JobDetail } from './job-detail.data';
import { JobQueryResult } from './job-query.data';
import { JobStats } from './job-stats.data';

export interface LoadingState<T> {
  data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export type JobDetailState = {
  readonly operation: 'fetch' | 'create' | 'update' | 'delete' | null;
} & LoadingState<JobDetail>;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheModel {
  readonly queries: ReadonlyMap<string, CacheEntry<JobQueryResult>>;
  readonly jobs: ReadonlyMap<string, CacheEntry<JobDetail>>;
  readonly statistics: CacheEntry<JobStats> | null;
}

export interface JobsState {
  readonly queryResult: LoadingState<JobQueryResult>;
  readonly detail: JobDetailState;
  readonly statistics: LoadingState<JobStats>;
  readonly caches: CacheModel;
}

export const initialJobsState: JobsState = {
  queryResult: { data: null, isLoading: false, error: null },
  detail: { data: null, isLoading: false, error: null, operation: null },
  statistics: { data: null, isLoading: false, error: null },
  caches: {
    queries: new Map(),
    jobs: new Map(),
    statistics: null,
  },
};
