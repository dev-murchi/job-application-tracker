const { StatusCodes } = require('http-status-codes');
const { jobService } = require('../services');

/**
 * Create a new job posting
 */
const createJob = async (req, res) => {
  const job = await jobService.createJob(req.body, req.user.userId);
  res.status(StatusCodes.CREATED).json({ job });
};

/**
 * Get all jobs with pagination and filtering
 */
const getAllJobs = async (req, res) => {
  const result = await jobService.getAllJobs(req.user.userId, req.query);
  res.status(StatusCodes.OK).json(result);
};

/**
 * Get a single job by ID
 */
const getJob = async (req, res) => {
  const job = await jobService.getJobById(req.params.id);
  res.status(StatusCodes.OK).json({ job });
};

/**
 * Update a job
 */
const updateJob = async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.body, req.user);
  res.status(StatusCodes.OK).json({ job });
};

/**
 * Delete a job
 */
const deleteJob = async (req, res) => {
  await jobService.deleteJob(req.params.id, req.user);
  res.status(StatusCodes.OK).json({ msg: 'Success! Job removed' });
};

/**
 * Get job statistics
 */
const showStats = async (req, res) => {
  const stats = await jobService.getJobStats(req.user.userId);
  res.status(StatusCodes.OK).json(stats);
};

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
  getJob,
};
