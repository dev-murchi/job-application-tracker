/**
 * Centralized schema exports
 * Provides a single entry point for all validation schemas
 */

// Common schemas
const { MongooseObjectIdSchema, PaginationSchema } = require('./common.schemas');

// Auth schemas
const { UserRegisterSchema, UserLoginSchema } = require('./auth.schemas');

// User schemas
const { UserUpdateSchema } = require('./user.schemas');

// Job schemas
const { JobSearchQuerySchema, JobCreateSchema, JobUpdateSchema } = require('./job.schemas');

// Config schemas
const { ConfigSchema } = require('./config.schemas');

module.exports = {
  // Common
  MongooseObjectIdSchema,
  PaginationSchema,

  // Auth
  UserRegisterSchema,
  UserLoginSchema,

  // User
  UserUpdateSchema,

  // Job
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,

  // Config
  ConfigSchema,
};
