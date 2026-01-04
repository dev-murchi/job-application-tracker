const express = require('express');
const {
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
} = require('../schemas');
const { validateQuery, validateBody, validateParams } = require('../middleware');
const { z } = require('zod');

/**
 * Factory function to create jobs router with injected dependencies
 * @param {Object} dependencies - Jobs Router dependencies
 * @param {Object} dependencies.jobsController - Jobs controller
 * @returns {express.Router} Configured Express router
 */
const createJobsRouter = ({ jobsController }) => {
  const router = express.Router();

  router
    .route('/')
    .post(validateBody(JobCreateSchema), jobsController.createJob)
    .get(validateQuery(JobSearchQuerySchema), jobsController.getAllJobs);

  router.route('/stats').get(jobsController.showStats);

  router
    .route('/:id')
    .all(validateParams(z.object({ id: MongooseObjectIdSchema })))
    .get(jobsController.getJob)
    .patch(validateBody(JobUpdateSchema), jobsController.updateJob)
    .delete(jobsController.deleteJob);

  return router;
};

module.exports = { createJobsRouter };
