const express = require('express');
const {
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
} = require('../../../../../../shared/schemas');
const { validateQuery, validateBody, validateParams } = require('../middlewares');
const { z } = require('zod');
const { createJobsController } = require('../controllers/jobs');

/**@typedef {import('../../../../../../application/ports/driving/job.service.port').JobServicePort} JobServicePort */

/**
 * Factory function to create jobs router with injected dependencies
 * @param {Object} dependencies - Jobs Router dependencies
 * @param {JobServicePort} dependencies.jobService - Jobs service
 * @returns {express.Router} Configured Express router
 */
const createJobsRouter = ({ jobService }) => {
  const router = express.Router();
  const jobsController = createJobsController({ jobService });

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
