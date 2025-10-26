const { BadRequestError, NotFoundError } = require('../../errors');
const checkPermissions = require('../../utils/check-permissions');
const mongoose = require('mongoose');
const dbService = require('../../db/db-service');

jest.mock('../../db/db-service');
jest.mock('../../utils/check-permissions');

// Mock Job model
const Job = {
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

// Setup dbService mock to return our mocked Job model
dbService.getModel = jest.fn().mockImplementation((modelName) => {
  if (modelName === 'Job') {
    return Job;
  }
  return null;
});

const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  showStats,
  getJob,
} = require('../../controllers/jobs');
describe('Jobs Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      user: { userId: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    checkPermissions.mockImplementation((reqUser, userId) => {
      if (reqUser.userId === userId.toString()) {
        return;
      }

      throw new Error('Not authorized to access this route');
    });

    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job with all required fields', async () => {
      req.body = {
        position: 'Software Engineer',
        company: 'Tech Corp',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
      };

      const mockJob = { _id: 'job123', ...req.body };
      Job.create.mockResolvedValue(mockJob);

      await createJob(req, res);

      expect(Job.create).toHaveBeenCalledWith({
        company: 'Tech Corp',
        position: 'Software Engineer',
        createdBy: 'user123',
        companyWebsite: 'https://techcorp.com',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ job: mockJob });
    });

    it('should create a job with optional jobPostingUrl', async () => {
      req.body = {
        position: 'Developer',
        company: 'StartUp Inc',
        jobType: 'part-time',
        jobLocation: 'NYC',
        status: 'interview',
        companyWebsite: 'https://startup.com',
        jobPostingUrl: 'https://startup.com/careers/123',
      };

      const mockJob = { _id: 'job456', ...req.body };
      Job.create.mockResolvedValue(mockJob);

      await createJob(req, res);

      expect(Job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobPostingUrl: 'https://startup.com/careers/123',
        }),
      );
    });

    it('should create a job without optional jobPostingUrl', async () => {
      req.body = {
        position: 'Designer',
        company: 'Design Co',
        jobType: 'internship',
        jobLocation: 'LA',
        status: 'pending',
        companyWebsite: 'https://design.com',
      };

      const mockJob = { _id: 'job789', ...req.body };
      Job.create.mockResolvedValue(mockJob);

      await createJob(req, res);

      expect(Job.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          jobPostingUrl: expect.anything(),
        }),
      );
    });
  });

  describe('getAllJobs', () => {
    const mockJobs = [
      { _id: '1', position: 'Engineer', company: 'A Corp' },
      { _id: '2', position: 'Designer', company: 'B Corp' },
    ];

    beforeEach(() => {
      req.query = { page: 1, limit: 10 };
    });

    it('should return all jobs with default pagination', async () => {
      Job.countDocuments.mockResolvedValue(2);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(Job.countDocuments).toHaveBeenCalledWith({ createdBy: 'user123' });
      expect(res.json).toHaveBeenCalledWith({
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      });
    });

    it('should filter jobs by status', async () => {
      req.query = { status: 'interview', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(1);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockJobs[0]]),
      });

      await getAllJobs(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'interview',
        }),
      );
    });

    it('should filter jobs by jobType', async () => {
      req.query = { jobType: 'full-time', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(1);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockJobs[0]]),
      });

      await getAllJobs(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: 'full-time',
        }),
      );
    });

    it('should search jobs by position', async () => {
      req.query = { search: 'engineer', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(1);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockJobs[0]]),
      });

      await getAllJobs(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { position: { $regex: 'engineer', $options: 'i' } },
            { company: { $regex: 'engineer', $options: 'i' } },
          ],
        }),
      );
    });

    it('should sort jobs by newest (default)', async () => {
      req.query = { page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(2);
      const mockSort = jest.fn().mockReturnThis();
      Job.find.mockReturnValue({
        sort: mockSort,
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(mockSort).toHaveBeenCalledWith('-createdAt');
    });

    it('should sort jobs by oldest', async () => {
      req.query = { sort: 'oldest', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(2);
      const mockSort = jest.fn().mockReturnThis();
      Job.find.mockReturnValue({
        sort: mockSort,
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(mockSort).toHaveBeenCalledWith('createdAt');
    });

    it('should sort jobs alphabetically (a-z)', async () => {
      req.query = { sort: 'a-z', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(2);
      const mockSort = jest.fn().mockReturnThis();
      Job.find.mockReturnValue({
        sort: mockSort,
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(mockSort).toHaveBeenCalledWith('position');
    });

    it('should sort jobs reverse alphabetically (z-a)', async () => {
      req.query = { sort: 'z-a', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(2);
      const mockSort = jest.fn().mockReturnThis();
      Job.find.mockReturnValue({
        sort: mockSort,
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(mockSort).toHaveBeenCalledWith('-position');
    });

    it('should handle pagination correctly', async () => {
      req.query = { page: 2, limit: 5 };

      Job.countDocuments.mockResolvedValue(12);
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockJobs);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: mockSkip,
        limit: mockLimit,
      });

      await getAllJobs(req, res);

      expect(mockSkip).toHaveBeenCalledWith(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        jobs: mockJobs,
        page: 2,
        numOfPages: 3,
        totalJobs: 12,
      });
    });

    it('should return empty array when no jobs exist', async () => {
      req.query = { page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(0);

      await getAllJobs(req, res);

      expect(res.json).toHaveBeenCalledWith({
        jobs: [],
        page: 1,
        numOfPages: 0,
        totalJobs: 0,
      });
      expect(Job.find).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when page is out of range', async () => {
      req.query = { page: 5, limit: 10 };

      Job.countDocuments.mockResolvedValue(10);

      await expect(getAllJobs(req, res)).rejects.toThrow(BadRequestError);
      await expect(getAllJobs(req, res)).rejects.toThrow('Requested page does not exist');
    });

    it('should ignore status filter when set to "all"', async () => {
      req.query = { status: 'all', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(2);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          status: expect.anything(),
        }),
      );
    });

    it('should ignore jobType filter when set to "all"', async () => {
      req.query = { jobType: 'all', page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(2);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await getAllJobs(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          jobType: expect.anything(),
        }),
      );
    });
  });

  describe('updateJob', () => {
    const jobId = 'job123';
    const mockJob = {
      _id: jobId,
      company: 'Old Corp',
      position: 'Old Position',
      createdBy: 'user123',
    };

    beforeEach(() => {
      req.params = { id: jobId };
    });

    it('should update a job successfully', async () => {
      req.body = {
        company: 'New Corp',
        position: 'New Position',
        status: 'interview',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://newcorp.com',
      };

      Job.findOne.mockResolvedValue(mockJob);
      const updatedJob = { ...mockJob, ...req.body };
      Job.findOneAndUpdate.mockResolvedValue(updatedJob);

      await updateJob(req, res);

      expect(checkPermissions).toHaveBeenCalledWith(req.user, mockJob.createdBy);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId },
        expect.objectContaining({
          company: 'New Corp',
          position: 'New Position',
          status: 'interview',
        }),
        { new: true, runValidators: true },
      );
      expect(res.json).toHaveBeenCalledWith({ job: updatedJob });
    });

    it('should throw BadRequestError when no changes provided', async () => {
      req.body = {};

      await expect(updateJob(req, res)).rejects.toThrow(BadRequestError);
      await expect(updateJob(req, res)).rejects.toThrow('No changes provided');
    });

    it('should throw NotFoundError when job does not exist', async () => {
      req.body = { company: 'New Corp' };
      Job.findOne.mockResolvedValue(null);

      await expect(updateJob(req, res)).rejects.toThrow(NotFoundError);
      await expect(updateJob(req, res)).rejects.toThrow(`No job with id :${jobId}`);
    });

    it('should update job with optional jobPostingUrl', async () => {
      req.body = {
        company: 'New Corp',
        jobPostingUrl: 'https://newcorp.com/job/123',
      };

      Job.findOne.mockResolvedValue(mockJob);
      Job.findOneAndUpdate.mockResolvedValue({ ...mockJob, ...req.body });

      await updateJob(req, res);

      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId },
        expect.objectContaining({
          jobPostingUrl: 'https://newcorp.com/job/123',
        }),
        expect.any(Object),
      );
    });

    it('should clear jobPostingUrl when empty string is provided', async () => {
      req.body = {
        company: 'New Corp',
        jobPostingUrl: '',
      };

      Job.findOne.mockResolvedValue(mockJob);
      Job.findOneAndUpdate.mockResolvedValue({ ...mockJob, ...req.body });

      await updateJob(req, res);

      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId },
        expect.objectContaining({
          jobPostingUrl: '',
        }),
        expect.any(Object),
      );
    });

    it('should check permissions before updating', async () => {
      req.body = { company: 'New Corp' };

      const secondUserReq = {
        ...req,
        user: { userId: 'user999' },
      };

      Job.findOne.mockResolvedValue(mockJob);

      await expect(updateJob(secondUserReq, res)).rejects.toThrow(
        'Not authorized to access this route',
      );
      expect(Job.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteJob', () => {
    const jobId = 'job123';
    const mockJob = {
      _id: jobId,
      createdBy: 'user123',
    };

    beforeEach(() => {
      req.params = { id: jobId };
    });

    it('should delete a job successfully', async () => {
      Job.findOne.mockResolvedValue(mockJob);
      Job.findOneAndDelete.mockResolvedValue(mockJob);

      await deleteJob(req, res);

      expect(checkPermissions).toHaveBeenCalledWith(req.user, mockJob.createdBy);
      expect(Job.findOneAndDelete).toHaveBeenCalledWith({ _id: jobId });
      expect(res.json).toHaveBeenCalledWith({ msg: 'Success! Job removed' });
    });

    it('should throw NotFoundError when job does not exist', async () => {
      Job.findOne.mockResolvedValue(null);

      await expect(deleteJob(req, res)).rejects.toThrow(NotFoundError);
      await expect(deleteJob(req, res)).rejects.toThrow(`No job with id :${jobId}`);
    });

    it('should check permissions before deleting', async () => {
      const job = {
        ...mockJob,
        createdBy: 'user999',
      };

      Job.findOne.mockResolvedValue(job);
      await expect(deleteJob(req, res)).rejects.toThrow('Not authorized to access this route');
      expect(Job.findOneAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('showStats', () => {
    const userId = 'user123';

    beforeEach(() => {
      req.user = { userId };
      jest.spyOn(mongoose.Types.ObjectId, 'createFromHexString').mockReturnValue(userId);
      const now = new Date('2024-01-15');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return job statistics and monthly applications', async () => {
      const mockStats = [
        { _id: 'pending', count: 5 },
        { _id: 'interview', count: 3 },
        { _id: 'declined', count: 2 },
      ];

      const mockMonthlyApplications = [
        { _id: { year: 2024, month: 1 }, count: 8 },
        { _id: { year: 2023, month: 12 }, count: 5 },
      ];

      Job.aggregate.mockResolvedValueOnce(mockStats).mockResolvedValueOnce(mockMonthlyApplications);

      await showStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        defaultStats: {
          pending: 5,
          interview: 3,
          offered: 0,
          accepted: 0,
          declined: 2,
        },
        monthlyApplications: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            count: expect.any(Number),
          }),
        ]),
      });

      // global.Date.mockRestore();
    });

    it('should return zero stats when no jobs exist', async () => {
      Job.aggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await showStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        defaultStats: {
          pending: 0,
          interview: 0,
          offered: 0,
          accepted: 0,
          declined: 0,
        },
        monthlyApplications: expect.any(Array),
      });
    });

    it('should fill missing months with zero count', async () => {
      const mockStats = [{ _id: 'pending', count: 1 }];
      const mockMonthlyApplications = [{ _id: { year: 2024, month: 3 }, count: 1 }];

      Job.aggregate.mockResolvedValueOnce(mockStats).mockResolvedValueOnce(mockMonthlyApplications);

      await showStats(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.monthlyApplications).toHaveLength(6);
      expect(result.monthlyApplications.some((m) => m.count === 0)).toBe(true);

      // global.Date.mockRestore();
    });
  });

  describe('getJob', () => {
    const jobId = 'job123';
    const mockJob = {
      _id: jobId,
      company: 'Tech Corp',
      position: 'Engineer',
    };

    beforeEach(() => {
      req.params = { id: jobId };
    });

    it('should return a job by id', async () => {
      Job.findOne.mockResolvedValue(mockJob);

      await getJob(req, res);

      expect(Job.findOne).toHaveBeenCalledWith({ _id: jobId });
      expect(res.json).toHaveBeenCalledWith({ job: mockJob });
    });

    it('should throw NotFoundError when job does not exist', async () => {
      Job.findOne.mockResolvedValue(null);

      await expect(getJob(req, res)).rejects.toThrow(NotFoundError);
      await expect(getJob(req, res)).rejects.toThrow(`No job with id :${jobId}`);
    });
  });
});
