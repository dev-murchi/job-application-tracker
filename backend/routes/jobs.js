const express = require('express');
const { jobsController } = require('../controllers');
const {
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
} = require('../schemas');
const { validateQuery, validateBody, validateParams } = require('../middleware');
const z = require('zod');

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

module.exports = router;
