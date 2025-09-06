const express = require('express');
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
} = require('../controllers/jobs');

const router = express.Router();

router.route('/').post(createJob).get(getAllJobs);
router.route('/stats').get(showStats);
router.route('/:id').delete(deleteJob).patch(updateJob);

module.exports = router;
