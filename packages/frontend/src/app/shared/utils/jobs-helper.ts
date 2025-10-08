
import { CacheEntry, CacheModel } from "../../jobs-state.data";
import { JobDetail } from "../types/job-detail.data";
import { JobQuery, JobQueryResult } from "../types/job-query.data";

export class JobsHelper {
    static sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(JobsHelper.sortKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result: any, key: string) => ({
          ...result,
          [key]: JobsHelper.sortKeys(obj[key])
        }), {});
    }
    return obj;
  }

  static normalizeQuery(query: JobQuery): string {
    return JSON.stringify(JobsHelper.sortKeys(query));
  }

  static withUpdatedJobCache(caches: CacheModel, job: JobDetail) {
    return {
      ...caches,
      jobs: new Map(caches.jobs).set(job._id!, { data: job, timestamp: Date.now() }),
    }
  }

  static withRemovedJobCache(caches: CacheModel, jobId: string): CacheModel {
    const newJobsMap = new Map(caches.jobs);
    newJobsMap.delete(jobId);

    const newQueriesMap = new Map<string, CacheEntry<JobQueryResult>>();
    caches.queries.forEach((value, key) => {
      const updatedJobs = value.data.jobs.filter((job) => job._id !== jobId);
      if (updatedJobs.length === value.data.jobs.length) {
        newQueriesMap.set(key, value);
      } else {
        // If a job was removed, update the query result entry
        newQueriesMap.set(key, {
          ...value,
          data: {
            ...value.data,
            jobs: updatedJobs,
            totalJobs: value.data.totalJobs - 1,
          },
        });
      }
    });

    return { ...caches, jobs: newJobsMap, queries: newQueriesMap, statistics: null };
  }

  static withInvalidatedListCaches(caches: CacheModel): CacheModel {
    return {
      ...caches,
      queries: new Map(),
      statistics: null,
    }
  }
}
