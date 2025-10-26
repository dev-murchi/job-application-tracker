const mongoose = require('mongoose');
const config = require('../config');

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Please provide company name'],
      maxlength: 50,
    },
    position: {
      type: String,
      required: [true, 'Please provide position'],
      maxlength: 100,
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
    },
    companyWebsite: {
      type: String,
      required: true,
    },
    jobPostingUrl: {
      type: String,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true, autoIndex: !config.isProduction },
);

JobSchema.index({ createdBy: 1 }, { background: true, name: 'created_by_idx' });

JobSchema.index(
  { createdBy: 1, createdAt: -1 },
  { background: true, name: 'user_created_desc_idx' },
);

JobSchema.index({ createdBy: 1, createdAt: 1 }, { background: true, name: 'user_created_asc_idx' });

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

module.exports = JobSchema;
