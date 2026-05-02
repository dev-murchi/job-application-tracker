const requiredMethods = [
  'create',
  'findById',
  'findWithPagination',
  'count',
  'updateById',
  'deleteById',
  'getStatusDistributionForUser',
  'getMonthlyCountsForUser',
];
const jobRepositoryContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`JobRepository adapter must implement '${method}()'`);
      }
    }
  },
};

/** @typedef {import("../../../../shared/dtos/job.dto").JobDTO} JobDTO */

/**
 * @typedef {Object} PaginationOptions
 * @property {string}  [sort]   - Sort expression (e.g. `-createdAt`).
 * @property {number}  [skip]   - Number of documents to skip.
 * @property {number}  [limit]  - Maximum number of documents to return.
 */

/**
 * @typedef {Object} StatusDistribution
 * @property {number}  pending
 * @property {number}  interview
 * @property {number}  offered
 * @property {number}  accepted
 * @property {number}  declined
 */

/**
 * @typedef {Object} MonthlyCount
 * @property {string}  date   - Month label formatted as `yyyy-MM`.
 * @property {number}  count  - Number of jobs created that month.
 */

/**
 * Port: JobRepository
 *
 * Driven port — used by the application layer to persist and retrieve job data.
 * Any adapter bound to JOB_REPOSITORY_PORT must satisfy this interface.
 *
 * @typedef {Object} JobRepositoryPort
 * @property {(data: Object) => Promise<Record<string, any>>}                                                   create                        - Persist a new job and return the created document.
 * @property {(id: string) => Promise<Record<string, any>|null>}                                                findById                      - Find a single job by ID.
 * @property {(filter: Object, options?: PaginationOptions) => Promise<Array<Record<string, any>>>}             findWithPagination            - Find jobs matching a filter with optional sort/skip/limit.
 * @property {(filter: Object) => Promise<number>}                                                              count                         - Count jobs matching a filter.
 * @property {(id: string, data: Object) => Promise<Record<string, any>|null>}                                  updateById                    - Update a job by ID and return the updated document.
 * @property {(id: string) => Promise<Record<string, any>|null>}                                                deleteById                    - Delete a job by ID and return the deleted document.
 * @property {(userId: string) => Promise<StatusDistribution>}                                                  getStatusDistributionForUser  - Aggregate job counts grouped by status for a user.
 * @property {(userId: string, lookbackMonths: number) => Promise<Array<MonthlyCount>>}                         getMonthlyCountsForUser       - Aggregate monthly job creation counts for a user.
 */

module.exports = { jobRepositoryContract };
