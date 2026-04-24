const { BadRequestError, NotFoundError } = require('../errors');
const { checkPermissions } = require('../utils');
const { MONTHLY_STATS_LOOKBACK_MONTHS } = require('../constants');

/**
 * Factory function to create job service with injected dependencies
 * @param {Object} jobRepository - Job database repository
 */
const createJobService = ({ jobRepository }) => {
  /**
   * Create a new job posting
   * @param {Object} jobData - Job data
   * @param {String} userId - User ID creating the job
   * @returns {Object} Created job
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
    return job;
  };

  /**
   * Build query object for job search
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
   * Get sort options mapping
   */
  const getSortOptions = () => ({
    newest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'position',
    'z-a': '-position',
  });

  /**
   * Get all jobs with pagination and filtering
   * @param {String} userId - User ID
   * @param {Object} filters - Search filters and pagination params
   * @returns {Object} Jobs with pagination metadata
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

    const jobs = await jobRepository.findWithPagination(queryObject, {
      sort: sortOptions[sort] || '-createdAt',
      skip,
      limit,
    });

    return { jobs, page, numOfPages, totalJobs };
  };

  /**
   * Get a single job by ID
   * @param {String} jobId - Job ID
   * @returns {Object} Job document
   * @throws {NotFoundError} If job not found
   */
  const getJobById = async (jobId) => {
    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new NotFoundError(`No job with id :${jobId}`);
    }

    return job;
  };

  /**
   * Update a job
   * @param {String} jobId - Job ID
   * @param {Object} updates - Fields to update
   * @param {Object} user - Current user (for permission check)
   * @returns {Object} Updated job
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

    return updatedJob;
  };

  /**
   * Delete a job
   * @param {String} jobId - Job ID
   * @param {Object} user - Current user (for permission check)
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
   * @param {String} userId - User ID
   * @returns {Object} Stats by status and monthly applications
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
