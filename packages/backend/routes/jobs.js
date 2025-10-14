const express = require('express');
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
  getJob,
} = require('../controllers/jobs');
const { validateData, JobSearchQuerySchema, JobCreateSchema, JobUpdateSchema, MongooseObjectId } = require('../middleware/validation');

const router = express.Router();

router.route('/')
  .post((req, res, next) => {
    req.body = validateData(JobCreateSchema, req.body);
    next()
  }, createJob)
  .get((req, res, next) => {
    req.query = validateData(JobSearchQuerySchema, req.query);
    next();
  }, getAllJobs);

router.route('/stats').get(showStats);

router.route('/:id')
  .all((req, res, next) => {
    validateData(MongooseObjectId, req.params['id']);
    next();
  })
  .get(getJob)
  .patch((req, res, next) => {
    req.body = validateData(JobUpdateSchema, req.body);
    next()
  }, updateJob)
  .delete(deleteJob);

module.exports = router;
