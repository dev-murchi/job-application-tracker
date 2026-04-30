const { z } = require('zod');
const { PaginationSchema } = require('./common.schemas');
const {
  JOB_STATUS_ENUM,
  JOB_TYPE_ENUM,
  SORT_ORDER_ENUM,
  NAME_MIN_LENGTH,
} = require('../constants');

/**
 * Job search query validation schema
 * Supports filtering, sorting, and pagination
 */
const JobSearchQuerySchema = z.object({
  search: z.string().trim().min(NAME_MIN_LENGTH).optional(),
  status: z.union([z.literal('all'), z.enum(JOB_STATUS_ENUM)]).optional(),
  jobType: z.union([z.literal('all'), z.enum(JOB_TYPE_ENUM)]).optional(),
  sort: z.enum(SORT_ORDER_ENUM).default('newest'),
  ...PaginationSchema.shape,
});

/**
 * Job creation validation schema
 * All fields are required when creating a new job
 */
const JobCreateSchema = z
  .object({
    company: z.string().trim().min(1, 'Company name is required'),
    position: z.string().trim().min(1, 'Position is required'),
    jobType: z.enum(JOB_TYPE_ENUM, {
      error: () => ({ message: 'Invalid job type' }),
    }),
    jobLocation: z.string().trim().min(1, 'Job location is required'),
    status: z.enum(JOB_STATUS_ENUM, {
      error: () => ({ message: 'Invalid status' }),
    }),
    companyWebsite: z.httpUrl('Invalid URL format'),
    jobPostingUrl: z.union([z.httpUrl('Invalid URL format'), z.literal('')]).optional(),
  })
  .strict();

/**
 * Job update validation schema
 * All fields are optional to support partial updates
 */
const JobUpdateSchema = z
  .object({
    company: z.string().trim().min(1, 'Company name is required').optional(),
    position: z.string().trim().min(1, 'Position is required').optional(),
    jobType: z.enum(JOB_TYPE_ENUM, { error: () => ({ message: 'Invalid job type' }) }).optional(),
    jobLocation: z.string().trim().min(1, 'Job location is required').optional(),
    status: z.enum(JOB_STATUS_ENUM, { error: () => ({ message: 'Invalid status' }) }).optional(),
    companyWebsite: z.httpUrl('Invalid URL format').optional(),
    jobPostingUrl: z.union([z.httpUrl('Invalid URL format'), z.literal('')]).optional(),
  })
  .strict();

module.exports = {
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
};
