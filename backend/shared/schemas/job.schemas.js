const { z } = require('zod');
const { PaginationSchema } = require('./common.schemas');
const {
  JOB_STATUS_ENUM,
  JOB_TYPE_ENUM,
  SORT_ORDER_ENUM,
  NAME_MIN_LENGTH,
  JOB_COMPANY_MAX_LENGTH,
  JOB_POSITION_MAX_LENGTH,
  JOB_LOCATION_MAX_LENGTH,
  JOB_SEARCH_MAX_LENGTH,
  URL_MAX_LENGTH,
} = require('../constants');

const UrlSchema = z
  .string()
  .trim()
  .max(URL_MAX_LENGTH, `URL must be at most ${URL_MAX_LENGTH} characters`)
  .url('Invalid URL format');

/**
 * Job search query validation schema
 * Supports filtering, sorting, and pagination
 */
const JobSearchQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH)
    .max(JOB_SEARCH_MAX_LENGTH, `Search term must be at most ${JOB_SEARCH_MAX_LENGTH} characters`)
    .optional(),
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
    company: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(
        JOB_COMPANY_MAX_LENGTH,
        `Company name must be at most ${JOB_COMPANY_MAX_LENGTH} characters`,
      ),
    position: z
      .string()
      .trim()
      .min(1, 'Position is required')
      .max(
        JOB_POSITION_MAX_LENGTH,
        `Position must be at most ${JOB_POSITION_MAX_LENGTH} characters`,
      ),
    jobType: z.enum(JOB_TYPE_ENUM, {
      error: () => ({ message: 'Invalid job type' }),
    }),
    jobLocation: z
      .string()
      .trim()
      .min(1, 'Job location is required')
      .max(
        JOB_LOCATION_MAX_LENGTH,
        `Job location must be at most ${JOB_LOCATION_MAX_LENGTH} characters`,
      ),
    status: z.enum(JOB_STATUS_ENUM, {
      error: () => ({ message: 'Invalid status' }),
    }),
    companyWebsite: UrlSchema,
    jobPostingUrl: z.union([UrlSchema, z.literal('')]).optional(),
  })
  .strict();

/**
 * Job update validation schema
 * All fields are optional to support partial updates
 */
const JobUpdateSchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(1, 'Company name is required')
      .max(
        JOB_COMPANY_MAX_LENGTH,
        `Company name must be at most ${JOB_COMPANY_MAX_LENGTH} characters`,
      )
      .optional(),
    position: z
      .string()
      .trim()
      .min(1, 'Position is required')
      .max(
        JOB_POSITION_MAX_LENGTH,
        `Position must be at most ${JOB_POSITION_MAX_LENGTH} characters`,
      )
      .optional(),
    jobType: z.enum(JOB_TYPE_ENUM, { error: () => ({ message: 'Invalid job type' }) }).optional(),
    jobLocation: z
      .string()
      .trim()
      .min(1, 'Job location is required')
      .max(
        JOB_LOCATION_MAX_LENGTH,
        `Job location must be at most ${JOB_LOCATION_MAX_LENGTH} characters`,
      )
      .optional(),
    status: z.enum(JOB_STATUS_ENUM, { error: () => ({ message: 'Invalid status' }) }).optional(),
    companyWebsite: UrlSchema.optional(),
    jobPostingUrl: z.union([UrlSchema, z.literal('')]).optional(),
  })
  .strict();

module.exports = {
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
};
