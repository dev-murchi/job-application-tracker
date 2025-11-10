const { BadRequestError, NotFoundError } = require('../errors');
const { checkPermissions } = require('../utils');
const mongoose = require('mongoose');
const { format } = require('date-fns');
const dbService = require('../db/db-service');

const Job = dbService.getModel('Job');

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

  const job = await Job.create(data);
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

  const totalJobs = await Job.countDocuments(queryObject);

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

  const jobs = await Job.find(queryObject)
    .sort(sortOptions[sort] || '-createdAt')
    .skip(skip)
    .limit(limit);

  return { jobs, page, numOfPages, totalJobs };
};

/**
 * Get a single job by ID
 * @param {String} jobId - Job ID
 * @returns {Object} Job document
 * @throws {NotFoundError} If job not found
 */
const getJobById = async (jobId) => {
  const job = await Job.findOne({ _id: jobId });

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

  const job = await Job.findOne({ _id: jobId });

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

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, data, {
    new: true,
    runValidators: true,
  });

  return updatedJob;
};

/**
 * Delete a job
 * @param {String} jobId - Job ID
 * @param {Object} user - Current user (for permission check)
 * @throws {NotFoundError} If job not found
 */
const deleteJob = async (jobId, user) => {
  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    throw new NotFoundError(`No job with id :${jobId}`);
  }

  checkPermissions(user, job.createdBy);

  await Job.findOneAndDelete({ _id: jobId });
};

/**
 * Get job statistics for a user
 * @param {String} userId - User ID
 * @returns {Object} Stats by status and monthly applications
 */
const getJobStats = async (userId) => {
  const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

  // Get stats by status
  let stats = await Job.aggregate([
    { $match: { createdBy: userObjectId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    offered: stats.offered || 0,
    accepted: stats.accepted || 0,
    declined: stats.declined || 0,
  };

  // Get monthly applications for last 6 months
  const endDate = new Date(Date.now());
  const N = 6;
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (N - 1), 1);

  const monthlyApplications = await Job.aggregate([
    { $match: { createdBy: userObjectId, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
  ]);

  const monthlyMap = monthlyApplications.reduce((acc, item) => {
    const { year, month } = item._id;
    const key = `${year}-${month}`;
    acc[key] = item.count;
    return acc;
  }, {});

  const monthlyApplicationsFilled = [];
  for (let i = N - 1; i >= 0; i--) {
    const dateObj = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const key = `${year}-${month}`;
    const date = format(dateObj, 'yyyy-MM');
    monthlyApplicationsFilled.push({
      date,
      count: monthlyMap[key] || 0,
    });
  }

  return { defaultStats, monthlyApplications: monthlyApplicationsFilled };
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobStats,
};
