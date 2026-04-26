const { createAuthService } = require('./auth.service');
const { createJobService } = require('./job.service');
const { createUserService } = require('./user.service');
const { createHealthService } = require('./health.service');
const { createJwtService } = require('./jwt.service');
const { createConfigService } = require('./config.service');

module.exports = {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
  createJwtService,
  createConfigService,
};
