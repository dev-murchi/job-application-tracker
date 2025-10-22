const { z } = require('zod');
const { CustomAPIError, BadRequestError } = require('../errors');
const mongoose = require('mongoose');

// Reusable Schema Components
const jobStatusEnum = [
  'interview',
  'declined',
  'pending',
  'offered',
  'accepted',
];
const jobTypeEnum = ['full-time', 'part-time', 'internship'];
const sortOrderEnum = ['a-z', 'z-a', 'newest', 'oldest'];

const UserRegisterSchema = z.object({
  name: z
    .string('Name is required')
    .trim()
    .min(3, 'Name must be at least 3 characters'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  location: z.string().trim().min(1, 'Location is required'),
});

const UserLoginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const JobSearchQuerySchema = z.object({
  search: z.string().trim().min(3).optional(),
  status: z.union([z.literal('all'), z.enum(jobStatusEnum)]).optional(),
  jobType: z.union([z.literal('all'), z.enum(jobTypeEnum)]).optional(),
  sort: z.enum(sortOrderEnum).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
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
    jobPostingUrl: z.httpUrl('Invalid URL format').optional(),
  })
  .strict();

const JobUpdateSchema = z
  .object({
    company: z.string().trim().min(1, 'Company name is required').optional(),
    position: z.string().trim().min(1, 'Position is required').optional(),
    jobType: z
      .enum(jobTypeEnum, { error: () => ({ message: 'Invalid job type' }) })
      .optional(),
    jobLocation: z
      .string()
      .trim()
      .min(1, 'Job location is required')
      .optional(),
    status: z
      .enum(jobStatusEnum, { error: () => ({ message: 'Invalid status' }) })
      .optional(),
    companyWebsite: z.httpUrl('Invalid URL format').optional(),
    jobPostingUrl: z
      .union([z.httpUrl('Invalid URL format'), z.literal('')])
      .optional(),
  })
  .strict();

const MongooseObjectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

const UserUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must be at least 3 characters')
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
