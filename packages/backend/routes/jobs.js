const express = require('express');
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
  getJob,
} = require('../controllers/jobs');
const { JobSearchQuerySchema, JobCreateSchema, JobUpdateSchema, MongooseObjectIdSchema } = require('../utils/validation');
const { validateQuery, validateBody, validateParams } = require('../middleware/validator');
const z = require('zod');

const router = express.Router();

router.route('/')
  .post(validateBody(JobCreateSchema), createJob)
  .get(validateQuery(JobSearchQuerySchema), getAllJobs);

router.route('/stats').get(showStats);

router.route('/:id')
  .all(validateParams(z.object({ id: MongooseObjectIdSchema })))
  .get(getJob)
  .patch(validateBody(JobUpdateSchema), updateJob)
  .delete(deleteJob);

module.exports = router;
