const attachCookie = require('./attach-cookie');
const checkPermissions = require('./check-permissions');
const logger = require('./logger');
const sanitizeData = require('./sanitize');
const {
  UserRegisterSchema,
  UserLoginSchema,
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
  UserUpdateSchema,
} = require('./validation');

module.exports = {
  attachCookie,
  checkPermissions,
  logger,
  sanitizeData,
  UserRegisterSchema,
  UserLoginSchema,
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
  UserUpdateSchema,
};
