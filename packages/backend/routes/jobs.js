const express = require('express');
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
  getJob,
} = require('../controllers/jobs');

const router = express.Router();

router.route('/').post(createJob).get(getAllJobs);
router.route('/stats').get(showStats);
router.route('/:id').delete(deleteJob).patch(updateJob).get(getJob);

module.exports = router;
