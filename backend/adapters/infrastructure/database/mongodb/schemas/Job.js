const mongoose = require('mongoose');
const {
  JOB_COMPANY_MAX_LENGTH,
  JOB_POSITION_MAX_LENGTH,
  JOB_LOCATION_MAX_LENGTH,
  URL_MAX_LENGTH,
} = require('../../../../../shared/constants');

/**
 * Creates a Mongoose schema for Job documents
 * @param {{ configService: object }} deps
 * @returns {mongoose.Schema} The configured Job schema
 */
const createJobSchema = ({ configService }) => {
  const autoIndex = !configService.get('isProduction');
  const JobSchema = new mongoose.Schema(
    {
      company: {
        type: String,
        required: [true, 'Please provide company name'],
        maxlength: JOB_COMPANY_MAX_LENGTH,
        trim: true,
      },
      position: {
        type: String,
        required: [true, 'Please provide position'],
        maxlength: JOB_POSITION_MAX_LENGTH,
        trim: true,
      },
      status: {
        type: String,
        enum: ['interview', 'declined', 'pending', 'offered', 'accepted'],
        default: 'pending',
      },
      jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'internship'],
        default: 'full-time',
      },
      jobLocation: {
        type: String,
        default: 'remote',
        required: true,
        maxlength: JOB_LOCATION_MAX_LENGTH,
        trim: true,
      },
      companyWebsite: {
        type: String,
        required: true,
        maxlength: URL_MAX_LENGTH,
        trim: true,
      },
      jobPostingUrl: {
        type: String,
        maxlength: URL_MAX_LENGTH,
        trim: true,
      },
      createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user'],
      },
    },
    { timestamps: true, autoIndex },
  );

  JobSchema.index({ createdBy: 1 }, { background: true, name: 'created_by_idx' });

  JobSchema.index(
    { createdBy: 1, createdAt: -1 },
    { background: true, name: 'user_created_desc_idx' },
  );

  JobSchema.index(
    { createdBy: 1, createdAt: 1 },
    { background: true, name: 'user_created_asc_idx' },
  );

  JobSchema.index(
    { createdBy: 1, status: 1, createdAt: -1 },
    { background: true, name: 'user_status_created_idx' },
  );

  JobSchema.index(
    { createdBy: 1, jobType: 1, createdAt: -1 },
    { background: true, name: 'user_jobtype_created_idx' },
  );

  JobSchema.index(
    { company: 'text', position: 'text' },
    {
      background: true,
      name: 'search_text_idx',
      weights: { position: 2, company: 1 },
    },
  );

  JobSchema.index(
    { createdBy: 1, company: 1, position: 1 },
    { background: true, name: 'user_company_position_idx' },
  );

  JobSchema.index({ createdBy: 1, status: 1 }, { background: true, name: 'user_status_idx' });
  return JobSchema;
};
module.exports = { createJobSchema };
