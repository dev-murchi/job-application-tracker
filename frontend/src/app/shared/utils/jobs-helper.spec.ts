import { JobsHelper } from './jobs-helper';
import { CacheModel } from '../../jobs-state.data';
import { JobDetail } from '../types/job-detail.data';
import { JobStatus } from '../types/job-status';
import { JobType } from '../types/job-type';
import { JobQuery, JobQueryResult } from '../types/job-query.data';
import { JobStats } from '../types/job-stats.data';

describe('JobsHelper', () => {
  describe('sortKeys', () => {
    it('should sort object keys alphabetically', () => {
      const input = { z: 1, a: 2, m: 3 };
      const result = JobsHelper.sortKeys(input);
      const keys = Object.keys(result);
      expect(keys).toEqual(['a', 'm', 'z']);
    });

    it('should handle nested objects', () => {
      const input = { z: { y: 1, x: 2 }, a: 3 };
      const result = JobsHelper.sortKeys(input);
      const outerKeys = Object.keys(result);
      const innerKeys = Object.keys(result.z);
      expect(outerKeys).toEqual(['a', 'z']);
      expect(innerKeys).toEqual(['x', 'y']);
    });

    it('should handle arrays', () => {
      const input = [
        { z: 1, a: 2 },
        { y: 3, b: 4 },
      ];
      const result = JobsHelper.sortKeys(input);
      expect(Object.keys(result[0])).toEqual(['a', 'z']);
      expect(Object.keys(result[1])).toEqual(['b', 'y']);
    });

    it('should return primitive values as-is', () => {
      expect(JobsHelper.sortKeys(42)).toBe(42);
      expect(JobsHelper.sortKeys('test')).toBe('test');
      expect(JobsHelper.sortKeys(null)).toBe(null);
    });
  });

  describe('normalizeQuery', () => {
    it('should normalize query to JSON string with sorted keys', () => {
      const query: JobQuery = {
        search: 'developer',
        status: JobStatus.Pending,
        page: 1,
      };
      const result = JobsHelper.normalizeQuery(query);
      expect(result).toBe(
        JSON.stringify({ page: 1, search: 'developer', status: JobStatus.Pending }),
      );
    });

    it('should produce same result for queries with different key order', () => {
      const query1: JobQuery = { page: 1, search: 'test' };
      const query2: JobQuery = { search: 'test', page: 1 };
      expect(JobsHelper.normalizeQuery(query1)).toBe(JobsHelper.normalizeQuery(query2));
    });
  });

  describe('withUpdatedJobCache', () => {
    it('should add job to cache', () => {
      const initialCache: CacheModel = {
        jobs: new Map(),
        queries: new Map(),
        statistics: null,
      };

      const job: JobDetail = {
        _id: 'job-123',
        position: 'Developer',
        company: 'Tech Corp',
        jobLocation: 'Remote',
        jobType: JobType.Fulltime,
        status: JobStatus.Pending,
        companyWebsite: 'https://techcorp.com',
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = JobsHelper.withUpdatedJobCache(initialCache, job);

      expect(result.jobs.has('job-123')).toBe(true);
      expect(result.jobs.get('job-123')?.data).toEqual(job);
      expect(result.jobs.get('job-123')?.timestamp).toBeDefined();
    });

    it('should update existing job in cache', () => {
      const job: JobDetail = {
        _id: 'job-123',
        position: 'Developer',
        company: 'Tech Corp',
        jobLocation: 'Remote',
        jobType: JobType.Fulltime,
        status: JobStatus.Pending,
        companyWebsite: 'https://techcorp.com',
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const initialCache: CacheModel = {
        jobs: new Map([['job-123', { data: job, timestamp: 1000 }]]),
        queries: new Map(),
        statistics: null,
      };

      const updatedJob: JobDetail = { ...job, status: JobStatus.Interview };
      const result = JobsHelper.withUpdatedJobCache(initialCache, updatedJob);

      expect(result.jobs.get('job-123')?.data.status).toBe(JobStatus.Interview);
      expect(result.jobs.get('job-123')?.timestamp).toBeGreaterThan(1000);
    });
  });

  describe('withRemovedJobCache', () => {
    it('should remove job from jobs cache', () => {
      const job: JobDetail = {
        _id: 'job-123',
        position: 'Developer',
        company: 'Tech Corp',
        jobLocation: 'Remote',
        jobType: JobType.Fulltime,
        status: JobStatus.Pending,
        companyWebsite: 'https://techcorp.com',
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const initialCache: CacheModel = {
        jobs: new Map([['job-123', { data: job, timestamp: Date.now() }]]),
        queries: new Map(),
        statistics: null,
      };

      const result = JobsHelper.withRemovedJobCache(initialCache, 'job-123');

      expect(result.jobs.has('job-123')).toBe(false);
    });

    it('should remove job from query results and update count', () => {
      const job1: JobDetail = {
        _id: 'job-123',
        position: 'Developer',
        company: 'Tech Corp',
        jobLocation: 'Remote',
        jobType: JobType.Fulltime,
        status: JobStatus.Pending,
        companyWebsite: 'https://techcorp.com',
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const job2: JobDetail = {
        _id: 'job-456',
        position: 'Designer',
        company: 'Design Inc',
        jobLocation: 'Remote',
        jobType: JobType.Fulltime,
        status: JobStatus.Pending,
        companyWebsite: 'https://designinc.com',
        createdBy: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const queryResult: JobQueryResult = {
        jobs: [job1, job2],
        totalJobs: 2,
        numOfPages: 1,
        page: 1,
      };

      const initialCache: CacheModel = {
        jobs: new Map([
          ['job-123', { data: job1, timestamp: Date.now() }],
          ['job-456', { data: job2, timestamp: Date.now() }],
        ]),
        queries: new Map([['query-1', { data: queryResult, timestamp: Date.now() }]]),
        statistics: null,
      };

      const result = JobsHelper.withRemovedJobCache(initialCache, 'job-123');

      expect(result.queries.get('query-1')?.data.jobs.length).toBe(1);
      expect(result.queries.get('query-1')?.data.jobs[0]._id).toBe('job-456');
      expect(result.queries.get('query-1')?.data.totalJobs).toBe(1);
    });

    it('should invalidate statistics cache', () => {
      const statistics: JobStats = {
        defaultStats: {
          interview: 3,
          declined: 2,
          pending: 5,
          offered: 1,
          accepted: 0,
        },
        monthlyApplications: [
          { date: '2024-01', count: 5 },
          { date: '2024-02', count: 6 },
        ],
      };

      const initialCache: CacheModel = {
        jobs: new Map([['job-123', { data: {} as JobDetail, timestamp: Date.now() }]]),
        queries: new Map(),
        statistics: { data: statistics, timestamp: Date.now() },
      };

      const result = JobsHelper.withRemovedJobCache(initialCache, 'job-123');

      expect(result.statistics).toBeNull();
    });
  });

  describe('withInvalidatedListCaches', () => {
    it('should clear queries and statistics caches', () => {
      const statistics: JobStats = {
        defaultStats: {
          interview: 3,
          declined: 2,
          pending: 5,
          offered: 1,
          accepted: 0,
        },
        monthlyApplications: [
          { date: '2024-01', count: 5 },
          { date: '2024-02', count: 6 },
        ],
      };

      const initialCache: CacheModel = {
        jobs: new Map([['job-123', { data: {} as JobDetail, timestamp: Date.now() }]]),
        queries: new Map([['query-1', { data: {} as JobQueryResult, timestamp: Date.now() }]]),
        statistics: { data: statistics, timestamp: Date.now() },
      };

      const result = JobsHelper.withInvalidatedListCaches(initialCache);

      expect(result.queries.size).toBe(0);
      expect(result.statistics).toBeNull();
      expect(result.jobs.size).toBe(1); // Jobs cache should remain unchanged
    });
  });
});
