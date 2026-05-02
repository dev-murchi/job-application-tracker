const requiredMethods = [
  'createJob',
  'getAllJobs',
  'getJobById',
  'updateJob',
  'deleteJob',
  'getJobStats',
];
const jobServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`JobService adapter must implement '${method}()'`);
      }
    }
  },
};

/** @typedef {import("../../../shared/dtos/job.dto").JobDTO} JobDTO */

/**
 * @typedef {Object} JobFilters
 * @property {string}  [search]    - Full-text search term matched against position and company.
 * @property {string}  [status]    - Filter by job status (e.g. `pending`, `interview`). `all` means no filter.
 * @property {string}  [jobType]   - Filter by job type (e.g. `full-time`). `all` means no filter.
 * @property {string}  [sort]      - Sort key: `newest` | `oldest` | `a-z` | `z-a`.
 * @property {number}  page        - 1-based current page number.
 * @property {number}  limit       - Number of jobs per page.
 */

/**
 * @typedef {Object} JobListResult
 * @property {JobDTO[]}  jobs         - Paginated array of job DTOs.
 * @property {number}    page         - Current page number.
 * @property {number}    numOfPages   - Total number of pages.
 * @property {number}    totalJobs    - Total number of matching jobs.
 */

/**
 * @typedef {Object} JobStatsResult
 * @property {import("../driven/database/job.repository.port").StatusDistribution}   defaultStats          - Job counts grouped by status.
 * @property {Array<import("../driven/database/job.repository.port").MonthlyCount>}  monthlyApplications   - Monthly job creation counts.
 */

/**
 * Port: JobService
 *
 * Driving port — called by the HTTP layer to manage job applications.
 * Any adapter bound to JOB_SERVICE_PORT must satisfy this interface.
 *
 * @typedef {Object} JobServicePort
 * @property {(jobData: Object, userId: string) => Promise<JobDTO>}                          createJob    - Create a new job posting for the given user.
 * @property {(userId: string, filters: JobFilters) => Promise<JobListResult>}               getAllJobs   - Retrieve a paginated, filtered list of jobs for the given user.
 * @property {(jobId: string) => Promise<JobDTO>}                                            getJobById   - Retrieve a single job by ID.
 * @property {(jobId: string, updates: Object, user: Object) => Promise<JobDTO>}             updateJob    - Update an existing job (ownership enforced).
 * @property {(jobId: string, user: Object) => Promise<void>}                               deleteJob    - Delete a job (ownership enforced).
 * @property {(userId: string) => Promise<JobStatsResult>}                                   getJobStats  - Return status distribution and monthly counts for the user.
 */

module.exports = { jobServiceContract };
