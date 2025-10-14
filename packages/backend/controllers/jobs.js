const Job = require('../models/Job.js');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index.js');
const checkPermissions = require('../utils/checkPermissions.js');
const mongoose = require('mongoose');
const { format } = require('date-fns');

const createJob = async (req, res) => {
  const { position, company, jobType, jobLocation, status, companyWebsite, jobPostingUrl } = req.body;

  const data = {
    company,
    position,
    createdBy: req.user.userId,
    companyWebsite,
    jobType,
    jobLocation,
    status,
    ...(jobPostingUrl && { jobPostingUrl }),
  };

  const job = await Job.create(data);

  res.status(StatusCodes.CREATED).json({ job });
};

const getAllJobs = async (req, res) => {
  const { search, status, jobType, sort, page, limit } = req.query;

  let queryObject = {
    createdBy: req.user.userId,
    ...(status && status !== 'all' && { status }),
    ...(jobType && jobType !== 'all' && { jobType }),
  };

  if (search) {
    queryObject = {
      ...queryObject,
      $or: [
        { position: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ]
    };
  }

  const sortOptions = {
    newest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'position',
    'z-a': '-position',
  };

  // setup pagination
  const totalJobs = await Job.countDocuments(queryObject);

  if (totalJobs === 0) {
    return res.status(StatusCodes.OK).json({ jobs: [], page, numOfPages: 0, totalJobs: 0 });
  }

  const numOfPages = Math.ceil(totalJobs / limit);

  if (page > numOfPages) {
    throw new BadRequestError('Requested page does not exist: page number is out of range for the available jobs.');
  }

  const skip = (page - 1) * limit;

  const jobs = await Job.find(queryObject)
    .sort(sortOptions[sort] || '-createdAt')
    .skip(skip)
    .limit(limit);

  res.status(StatusCodes.OK).json({ jobs, page, numOfPages, totalJobs });
};

const updateJob = async (req, res) => {
  const { id: jobId } = req.params;
  const { company, position, status, jobType, jobLocation, companyWebsite, jobPostingUrl } = req.body;

  if (!company && !position && !status && !jobType && !jobLocation && !companyWebsite && !jobPostingUrl) {
    throw new BadRequestError('No changes provided');
  }

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    throw new NotFoundError(`No job with id :${jobId}`);
  }

  // check permissions
  checkPermissions(req.user, job.createdBy);

  const data = {
    company,
    position,
    companyWebsite,
    ...(status && { status }),
    ...(jobType && { jobType }),
    ...(jobLocation && { jobLocation }),
    ...(jobPostingUrl && { jobPostingUrl }),
  };

  if (!data['jobLocation'] && typeof (jobLocation) === 'string') {
    data['jobLocation'] = '';
  }
  if (!data['jobPostingUrl'] && typeof (jobPostingUrl) === 'string') {
    data['jobPostingUrl'] = '';
  }

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, data, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ job: updatedJob });
};

const deleteJob = async (req, res) => {
  const { id: jobId } = req.params;

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    throw new NotFoundError(`No job with id :${jobId}`);
  }

  checkPermissions(req.user, job.createdBy);

  await Job.findOneAndDelete({ _id: jobId });

  res.status(StatusCodes.OK).json({ msg: 'Success! Job removed' });
};

const showStats = async (req, res) => {
  const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);

  let stats = await Job.aggregate([
    { $match: { createdBy: userId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    offered: stats.offered || 0,
    accepted: stats.accepted || 0,
    declined: stats.declined || 0,
  };

  const endDate = new Date(Date.now());
  const N = 6; // change N to desired number of months
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (N - 1), 1);

  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: userId, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
  ]);

  // Build a map for quick lookup
  const monthlyMap = monthlyApplications.reduce((acc, item) => {
    const { year, month } = item._id;
    const key = `${year}-${month}`;
    acc[key] = item.count;
    return acc;
  }, {});

  // Generate last N months with zeros for missing
  const monthlyApplicationsFilled = [];
  for (let i = N - 1; i >= 0; i--) {
    const dateObj = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const key = `${year}-${month}`;
    const date = format(dateObj, 'yyyy-MM');
    monthlyApplicationsFilled.push({
      date,
      count: monthlyMap[key] || 0,
    });
  }

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications: monthlyApplicationsFilled });
};

const getJob = async (req, res) => {
  const { id: jobId } = req.params;

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    throw new NotFoundError(`No job with id :${jobId}`);
  }

  res.status(StatusCodes.OK).json({ job });
}

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
  getJob,
};
