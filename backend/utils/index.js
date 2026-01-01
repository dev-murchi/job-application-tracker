const attachCookie = require('./attach-cookie');
const checkPermissions = require('./check-permissions');
const { createLoggerService } = require('./logger');
const { createSanitizer } = require('./sanitize');

module.exports = {
  attachCookie,
  checkPermissions,
  createLoggerService,
  createSanitizer,
};
