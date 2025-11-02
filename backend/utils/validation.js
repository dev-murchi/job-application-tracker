const { z } = require('zod');
const mongoose = require('mongoose');

// Reusable Schema Components
const jobStatusEnum = ['interview', 'declined', 'pending', 'offered', 'accepted'];
const jobTypeEnum = ['full-time', 'part-time', 'internship'];
const sortOrderEnum = ['a-z', 'z-a', 'newest', 'oldest'];

// Magic numbers as constants
const NAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 8;
const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 100;

const UserRegisterSchema = z.object({
  name: z
    .string('Name is required')
    .trim()
    .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  location: z.string().trim().min(1, 'Location is required'),
});

const UserLoginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const JobSearchQuerySchema = z.object({
  search: z.string().trim().min(NAME_MIN_LENGTH).optional(),
  status: z.union([z.literal('all'), z.enum(jobStatusEnum)]).optional(),
  jobType: z.union([z.literal('all'), z.enum(jobTypeEnum)]).optional(),
  sort: z.enum(sortOrderEnum).default('newest'),
  page: z.coerce.number().int().positive().default(PAGE_DEFAULT),
  limit: z.coerce.number().int().positive().max(LIMIT_MAX).default(LIMIT_DEFAULT),
});

const JobCreateSchema = z
  .object({
    company: z.string().trim().min(1, 'Company name is required'),
    position: z.string().trim().min(1, 'Position is required'),
    jobType: z.enum(jobTypeEnum, {
      error: () => ({ message: 'Invalid job type' }),
    }),
    jobLocation: z.string().trim().min(1, 'Job location is required'),
    status: z.enum(jobStatusEnum, {
      error: () => ({ message: 'Invalid status' }),
    }),
    companyWebsite: z.httpUrl('Invalid URL format'),
    jobPostingUrl: z.union([z.httpUrl('Invalid URL format'), z.literal('')]).optional(),
  })
  .strict();

const JobUpdateSchema = z
  .object({
    company: z.string().trim().min(1, 'Company name is required').optional(),
    position: z.string().trim().min(1, 'Position is required').optional(),
    jobType: z.enum(jobTypeEnum, { error: () => ({ message: 'Invalid job type' }) }).optional(),
    jobLocation: z.string().trim().min(1, 'Job location is required').optional(),
    status: z.enum(jobStatusEnum, { error: () => ({ message: 'Invalid status' }) }).optional(),
    companyWebsite: z.httpUrl('Invalid URL format').optional(),
    jobPostingUrl: z.union([z.httpUrl('Invalid URL format'), z.literal('')]).optional(),
  })
  .strict();

const MONGOOSE_OBJECT_ID_LENGTH = 24;

const MongooseObjectIdSchema = z
  .string()
  .trim()
  .length(MONGOOSE_OBJECT_ID_LENGTH, `ObjectId must be ${MONGOOSE_OBJECT_ID_LENGTH} characters`)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

const UserUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`)
      .optional(),
    lastName: z.string().trim().min(1, 'Last name is required').optional(),
    email: z.email('Invalid email format').optional(),
    location: z.string().trim().min(1, 'Location is required').optional(),
  })
  .strict();

module.exports = {
  UserRegisterSchema,
  UserLoginSchema,
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
  UserUpdateSchema,
};
