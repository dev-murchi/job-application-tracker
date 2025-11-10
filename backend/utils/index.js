const attachCookie = require('./attach-cookie');
const checkPermissions = require('./check-permissions');
const logger = require('./logger');
const sanitizeData = require('./sanitize');

module.exports = {
  attachCookie,
  checkPermissions,
  logger,
  sanitizeData,
};
