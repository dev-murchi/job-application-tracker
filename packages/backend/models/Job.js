const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Please provide company'],
      maxlength: 50,
    },
    position: {
      type: String,
      required: [true, 'Please provide position'],
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['interview', 'declined', 'pending', 'offered', 'accepted' ],
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
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
