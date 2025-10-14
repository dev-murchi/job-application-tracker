const { z } = require('zod');
const { CustomAPIError, BadRequestError } = require('../errors');
const mongoose = require('mongoose');

const UserRegisterationSchema = z.object({
  name: z.string().trim().min(3),
  lastName: z.string().trim().nonempty(),
  email: z.email(),
  password: z.string().trim().nonempty(),
  location: z.string().trim().nonempty(),
});

const UserLoginSchema = z.object({
  email: z.email().nonempty('Please provide email'),
  password: z.string().trim().nonempty('Please provide password'),
});

const JobSearchQuerySchema = z.object({
  search: z.string().trim().min(3).optional(),
  status: z.enum(['interview', 'declined', 'pending', 'offered', 'accepted']).optional(),
  jobType: z.enum(['full-time', 'part-time', 'internship']).optional(),
  sort: z.enum(['a-z', 'z-a', 'newest', 'oldest']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

const JobCreateSchema = z.object({
  company: z.string().trim().nonempty(),
  position: z.string().trim().nonempty(),
  jobType: z.enum(['full-time', 'part-time', 'internship']),
  jobLocation: z.string().trim().nonempty(),
  status: z.enum(['interview', 'declined', 'pending', 'offered', 'accepted']),
  companyWebsite: z.httpUrl(),
  jobPostingUrl: z.httpUrl().optional(),
});

const JobUpdateSchema = z.object({
  company: z.string().trim().optional(),
  position: z.string().trim().optional(),
  jobType: z.enum(['full-time', 'part-time', 'internship']).optional(),
  jobLocation: z.string().trim().optional(),
  status: z.enum(['interview', 'declined', 'pending', 'offered', 'accepted']).optional(),
  companyWebsite: z.httpUrl().optional(),
  jobPostingUrl: z.union([z.httpUrl(), z.literal('')]).optional(),
});

const MongooseObjectId = z.string().trim().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format"
});

const UserUpdateSchema = z.object({
  name: z.string().trim().min(3).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.email().optional(),
  location: z.string().trim().nonempty().optional(),
})

const validateData = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => `${err.path}: ${err.message}`).join(', ');
      throw new BadRequestError(errorMessages);
    } else {
      throw new Error(error);
    }
  }
}

module.exports = {
  validateData,
  UserRegisterationSchema,
  UserLoginSchema,
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectId,
  UserUpdateSchema,
}