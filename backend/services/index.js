const { createAuthService } = require('./auth.service');
const { createJobService } = require('./job.service');
const { createUserService } = require('./user.service');
const { createHealthService } = require('./health.service');

module.exports = {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
};
