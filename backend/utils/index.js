const checkPermissions = require('./check-permissions');
const { createLoggerService } = require('./logger');
const { createSanitizer } = require('./sanitize');

module.exports = {
  checkPermissions,
  createLoggerService,
  createSanitizer,
};
