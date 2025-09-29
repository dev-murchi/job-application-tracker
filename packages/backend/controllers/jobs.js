const Job = require('../models/Job.js');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index.js');
const checkPermissions = require('../utils/checkPermissions.js');
const mongoose = require('mongoose');
const { format } = require('date-fns');

const createJob = async (req, res) => {
  const { position, company, jobType, jobLocation } = req.body;

  if (!position || !company) {
    throw new BadRequestError('Please provide all values');
  }

  const data = {
    company,
    position,
    createdBy: req.user.userId,
    ...(jobType && { jobType }),
    ...(jobLocation && { jobLocation }),
  };

  const job = await Job.create(data);

  res.status(StatusCodes.CREATED).json({ job });
};

const getAllJobs = async (req, res) => {
  const { status, jobType, sort, search } = req.query;

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
    latest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'position',
    'z-a': '-position',
  };

  // setup pagination
  let page = Number(req.query.page) || 1;

  if (page < 1) {
    throw new BadRequestError('Requested page does not exist: page number is out of range for the available jobs.');
  }

  const limit = Number(req.query.limit) || 10;
  if (limit < 1) {
    throw new BadRequestError('Requested page does not exist: limit number is out of range for the available jobs.');
  }

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
  const { company, position, status, jobType, jobLocation } = req.body;

  if (!position || !company) {
    throw new BadRequestError('Please provide all values');
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
    ...(status && { status }),
    ...(jobType && { jobType }),
    ...(jobLocation && { jobLocation }),
  };

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, data, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ updatedJob });
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
    declined: stats.declined || 0,
  };

  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: userId } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = format(new Date(year, month - 1), 'yyyy-MM');
      return { date, count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
};
