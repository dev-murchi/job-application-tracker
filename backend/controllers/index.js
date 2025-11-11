const { createAuthController } = require('./auth');
const { createJobsController } = require('./jobs');
const { createUserController } = require('./user');
const { createHealthController } = require('./health');

module.exports = {
  createAuthController,
  createJobsController,
  createUserController,
  createHealthController,
};
