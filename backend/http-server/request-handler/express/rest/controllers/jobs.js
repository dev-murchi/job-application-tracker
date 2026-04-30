const { HttpStatusCodes } = require('../../../../../constants');

/**
 * Factory function to create jobs controller with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {Object} dependencies.jobService - Job service instance
 * @returns {Object} Jobs controller methods
 */
const createJobsController = ({ jobService }) => {
  /**
   * Create a new job posting
   */
  const createJob = async (req, res) => {
    const job = await jobService.createJob(req.body, req.user.userId);
    res.status(HttpStatusCodes.CREATED).json({ job });
  };

  /**
   * Get all jobs with pagination and filtering
   */
  const getAllJobs = async (req, res) => {
    const result = await jobService.getAllJobs(req.user.userId, req.query);
    res.status(HttpStatusCodes.OK).json(result);
  };

  /**
   * Get a single job by ID
   */
  const getJob = async (req, res) => {
    const job = await jobService.getJobById(req.params.id);
    res.status(HttpStatusCodes.OK).json({ job });
  };

  /**
   * Update a job
   */
  const updateJob = async (req, res) => {
    const job = await jobService.updateJob(req.params.id, req.body, req.user);
    res.status(HttpStatusCodes.OK).json({ job });
  };

  /**
   * Delete a job
   */
  const deleteJob = async (req, res) => {
    await jobService.deleteJob(req.params.id, req.user);
    res.status(HttpStatusCodes.OK).json({ msg: 'Success! Job removed' });
  };

  /**
   * Get job statistics
   */
  const showStats = async (req, res) => {
    const stats = await jobService.getJobStats(req.user.userId);
    res.status(HttpStatusCodes.OK).json(stats);
  };

  return {
    createJob,
    deleteJob,
    getAllJobs,
    updateJob,
    showStats,
    getJob,
  };
};

module.exports = {
  createJobsController,
};
