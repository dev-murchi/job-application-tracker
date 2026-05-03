const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../../shared/errors');
const { MONTHLY_STATS_LOOKBACK_MONTHS } = require('../../shared/constants');
const { createJobDTO } = require('../../shared/dtos/job.dto');

/**@typedef {import('../../shared/dtos/job.dto').JobDTO} JobDTO */
/**@typedef {import('../ports/driving/job.service.port').JobServicePort} JobServicePort */
/**@typedef {import('../ports/driving/job.service.port').JobFilters} JobFilters */
/**@typedef {import('../ports/driving/job.service.port').JobListResult} JobListResult */
/**@typedef {import('../ports/driving/job.service.port').JobStatsResult} JobStatsResult */
/**@typedef {import('../ports/driven/database/job.repository.port').JobRepositoryPort} JobRepositoryPort */

/**
 * Assert that the requesting user owns the resource.
 * @param {{ userId: string }} requestUser - The authenticated user making the request.
 * @param {*} resourceUserId - The owner ID stored on the resource (ObjectId or string).
 * @throws {UnauthenticatedError} If the user does not own the resource.
 */
const checkPermissions = (requestUser, resourceUserId) => {
  if (requestUser.userId === resourceUserId.toString()) {
    return;
  }

  throw new UnauthenticatedError('Not authorized to access this job');
};

/**
 * Factory function to create job service with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {JobRepositoryPort} dependencies.jobRepository - Job database repository
 * @returns {JobServicePort} Job service methods
 */
const createJobService = ({ jobRepository }) => {
  /**
   * Create a new job posting
   * @param {Object} jobData - Job data
   * @param {string} userId - User ID creating the job
   * @returns {Promise<JobDTO>} Created job
   */
  const createJob = async (jobData, userId) => {
    const { position, company, jobType, jobLocation, status, companyWebsite, jobPostingUrl } =
      jobData;

    const data = {
      company,
      position,
      createdBy: userId,
      companyWebsite,
      jobType,
      jobLocation,
      status,
      ...(jobPostingUrl && { jobPostingUrl }),
    };

    const job = await jobRepository.create(data);
    return createJobDTO(job);
  };

  /**
   * Build a MongoDB query object for job search.
   * @param {string} userId - The authenticated user's ID.
   * @param {JobFilters} filters - Search and filter parameters.
   * @returns {Object} Mongoose-compatible query object.
   */
  const buildSearchQuery = (userId, filters) => {
    const { search, status, jobType } = filters;

    let queryObject = {
      createdBy: userId,
      ...(status && status !== 'all' && { status }),
      ...(jobType && jobType !== 'all' && { jobType }),
    };

    if (search) {
      queryObject = {
        ...queryObject,
        $or: [
          { position: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
        ],
      };
    }

    return queryObject;
  };

  /**
   * Returns the sort-field mapping from user-facing sort keys to Mongoose sort expressions.
   * @returns {Record<string, string>} Map of sort key to Mongoose sort expression.
   */
  const getSortOptions = () => ({
    newest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'position',
    'z-a': '-position',
  });

  /**
   * Get all jobs with pagination and filtering
   * @param {string} userId - User ID
   * @param {JobFilters} filters - Search filters and pagination params
   * @returns {Promise<JobListResult>} Jobs with pagination metadata
   */
  const getAllJobs = async (userId, filters) => {
    const { sort, page, limit } = filters;

    const queryObject = buildSearchQuery(userId, filters);
    const sortOptions = getSortOptions();

    const totalJobs = await jobRepository.count(queryObject);

    if (totalJobs === 0) {
      return { jobs: [], page, numOfPages: 0, totalJobs: 0 };
    }

    const numOfPages = Math.ceil(totalJobs / limit);

    if (page > numOfPages) {
      throw new BadRequestError(
        'Requested page does not exist: page number is out of range for the available jobs.',
      );
    }

    const skip = (page - 1) * limit;

    const jobRecords = await jobRepository.findWithPagination(queryObject, {
      sort: sortOptions[sort] || '-createdAt',
      skip,
      limit,
    });

    const jobs = jobRecords.map((job) => createJobDTO(job));

    return { jobs, page, numOfPages, totalJobs };
  };

  /**
   * Get a single job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<JobDTO>} Job document
   * @throws {NotFoundError} If job not found
   */
  const getJobById = async (jobId) => {
    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new NotFoundError(`No job with id :${jobId}`);
    }

    return createJobDTO(job);
  };

  /**
   * Update a job
   * @param {string} jobId - Job ID
   * @param {Object} updates - Fields to update
   * @param {{ userId: string }} user - Current user (for permission check)
   * @returns {Promise<JobDTO>} Updated job
   * @throws {BadRequestError} If no updates provided
   * @throws {NotFoundError} If job not found
   */
  const updateJob = async (jobId, updates, user) => {
    const { company, position, status, jobType, jobLocation, companyWebsite, jobPostingUrl } =
      updates;

    if (
      !company &&
      !position &&
      !status &&
      !jobType &&
      !jobLocation &&
      !companyWebsite &&
      !jobPostingUrl
    ) {
      throw new BadRequestError('No changes provided');
    }

    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new NotFoundError(`No job with id :${jobId}`);
    }

    checkPermissions(user, job.createdBy);

    const data = {
      company,
      position,
      companyWebsite,
      ...(status && { status }),
      ...(jobType && { jobType }),
      ...(jobLocation && { jobLocation }),
      ...(jobPostingUrl && { jobPostingUrl }),
    };

    if (!data['jobPostingUrl'] && typeof jobPostingUrl === 'string') {
      data['jobPostingUrl'] = '';
    }

    const updatedJob = await jobRepository.updateById(jobId, data);

    return createJobDTO(updatedJob);
  };

  /**
   * Delete a job
   * @param {string} jobId - Job ID
   * @param {{ userId: string }} user - Current user (for permission check)
   * @returns {Promise<void>}
   * @throws {NotFoundError} If job not found
   */
  const deleteJob = async (jobId, user) => {
    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new NotFoundError(`No job with id :${jobId}`);
    }

    checkPermissions(user, job.createdBy);

    await jobRepository.deleteById(jobId);
  };

  /**
   * Get job statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<JobStatsResult>} Stats by status and monthly applications
   */
  const getJobStats = async (userId) => {
    // Use Promise.all for high performance (run both queries in parallel)
    const [defaultStats, monthlyApplications] = await Promise.all([
      jobRepository.getStatusDistributionForUser(userId),
      jobRepository.getMonthlyCountsForUser(userId, MONTHLY_STATS_LOOKBACK_MONTHS),
    ]);

    return {
      defaultStats,
      monthlyApplications,
    };
  };

  return {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    getJobStats,
  };
};

module.exports = {
  createJobService,
};
