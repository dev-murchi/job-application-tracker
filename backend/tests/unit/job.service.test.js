const { describe, beforeEach, it, expect } = require('@jest/globals');
const { BadRequestError, NotFoundError } = require('../../errors');
const { createJobService } = require('../../services/job.service');

// Mock check-permissions utility
jest.mock('../../utils/check-permissions');
const { checkPermissions } = require('../../utils');

// Mock mongoose ObjectId
jest.mock('mongoose');
const mongoose = require('mongoose');
const mockObjectId = (id) => ({ toString: () => id, _id: id });
mongoose.Types = {
  ObjectId: {
    createFromHexString: jest.fn((id) => mockObjectId(id)),
  },
};

// Create mock Job model
const createMockJob = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
});

// Create mock dbService
const createMockDbService = (Job) => ({
  getModel: jest.fn().mockImplementation((modelName) => {
    if (modelName === 'Job') {
      return Job;
    }
    return null;
  }),
});

describe('Job Service', () => {
  let jobService;
  let mockDbService;
  let Job;

  beforeEach(() => {
    jest.clearAllMocks();
    Job = createMockJob();
    mockDbService = createMockDbService(Job);
    jobService = createJobService({ dbService: mockDbService });
    checkPermissions.mockImplementation(() => {}); // Default: allow all
  });

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      const jobData = {
        position: 'Software Engineer',
        company: 'Tech Corp',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
      };
      const userId = 'user123';

      const mockCreatedJob = {
        _id: 'job123',
        ...jobData,
        createdBy: userId,
      };

      Job.create.mockResolvedValue(mockCreatedJob);

      const result = await jobService.createJob(jobData, userId);

      expect(Job.create).toHaveBeenCalledWith({
        company: jobData.company,
        position: jobData.position,
        createdBy: userId,
        companyWebsite: jobData.companyWebsite,
        jobType: jobData.jobType,
        jobLocation: jobData.jobLocation,
        status: jobData.status,
      });
      expect(result).toEqual(mockCreatedJob);
    });

    it('should create a job with jobPostingUrl when provided', async () => {
      const jobData = {
        position: 'Developer',
        company: 'StartUp Inc',
        jobType: 'part-time',
        jobLocation: 'NYC',
        status: 'interview',
        companyWebsite: 'https://startup.com',
        jobPostingUrl: 'https://startup.com/careers/123',
      };
      const userId = 'user456';

      const mockCreatedJob = { _id: 'job456', ...jobData };
      Job.create.mockResolvedValue(mockCreatedJob);

      const result = await jobService.createJob(jobData, userId);

      expect(Job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobPostingUrl: 'https://startup.com/careers/123',
        }),
      );
      expect(result).toEqual(mockCreatedJob);
    });

    it('should handle database errors during job creation', async () => {
      const jobData = {
        position: 'Engineer',
        company: 'Company',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://example.com',
      };

      Job.create.mockRejectedValue(new Error('Database error'));

      await expect(jobService.createJob(jobData, 'user123')).rejects.toThrow('Database error');
    });
  });

  describe('getAllJobs', () => {
    it('should return jobs with pagination', async () => {
      const userId = 'user123';
      const filters = {
        search: '',
        status: 'all',
        jobType: 'all',
        sort: 'newest',
        page: 1,
        limit: 10,
      };

      const mockJobs = [
        { _id: 'job1', position: 'Developer', company: 'CompanyA' },
        { _id: 'job2', position: 'Engineer', company: 'CompanyB' },
      ];

      Job.countDocuments.mockResolvedValue(2);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      const result = await jobService.getAllJobs(userId, filters);

      expect(Job.countDocuments).toHaveBeenCalledWith({ createdBy: userId });
      expect(result).toEqual({
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      });
    });

    it('should return empty array when no jobs found', async () => {
      const userId = 'user123';
      const filters = { page: 1, limit: 10 };

      Job.countDocuments.mockResolvedValue(0);

      const result = await jobService.getAllJobs(userId, filters);

      expect(result).toEqual({
        jobs: [],
        page: 1,
        numOfPages: 0,
        totalJobs: 0,
      });
      expect(Job.find).not.toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      const userId = 'user123';
      const filters = {
        search: 'developer',
        page: 1,
        limit: 10,
      };

      const mockJobs = [{ _id: 'job1', position: 'Developer' }];

      Job.countDocuments.mockResolvedValue(1);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockJobs),
      });

      await jobService.getAllJobs(userId, filters);

      expect(Job.countDocuments).toHaveBeenCalledWith({
        createdBy: userId,
        $or: [
          { position: { $regex: 'developer', $options: 'i' } },
          { company: { $regex: 'developer', $options: 'i' } },
        ],
      });
    });

    it('should filter by status when not "all"', async () => {
      const userId = 'user123';
      const filters = {
        status: 'interview',
        page: 1,
        limit: 10,
      };

      Job.countDocuments.mockResolvedValue(5);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await jobService.getAllJobs(userId, filters);

      expect(Job.countDocuments).toHaveBeenCalledWith({
        createdBy: userId,
        status: 'interview',
      });
    });

    it('should filter by jobType when not "all"', async () => {
      const userId = 'user123';
      const filters = {
        jobType: 'full-time',
        page: 1,
        limit: 10,
      };

      Job.countDocuments.mockResolvedValue(3);
      Job.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await jobService.getAllJobs(userId, filters);

      expect(Job.countDocuments).toHaveBeenCalledWith({
        createdBy: userId,
        jobType: 'full-time',
      });
    });

    it('should throw BadRequestError when page exceeds numOfPages', async () => {
      const userId = 'user123';
      const filters = {
        page: 5,
        limit: 10,
      };

      Job.countDocuments.mockResolvedValue(20); // Only 2 pages available

      await expect(jobService.getAllJobs(userId, filters)).rejects.toThrow(BadRequestError);
      await expect(jobService.getAllJobs(userId, filters)).rejects.toThrow(
        'Requested page does not exist',
      );
    });

    it('should apply correct sort options', async () => {
      const userId = 'user123';
      const filters = {
        sort: 'a-z',
        page: 1,
        limit: 10,
      };

      Job.countDocuments.mockResolvedValue(5);
      const mockSort = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      Job.find.mockReturnValue({
        sort: mockSort,
        skip: mockSkip,
        limit: mockLimit,
      });

      await jobService.getAllJobs(userId, filters);

      expect(mockSort).toHaveBeenCalledWith('position');
    });
  });

  describe('getJobById', () => {
    it('should return job when found', async () => {
      const jobId = 'job123';
      const mockJob = {
        _id: jobId,
        position: 'Developer',
        company: 'TechCo',
      };

      Job.findOne.mockResolvedValue(mockJob);

      const result = await jobService.getJobById(jobId);

      expect(Job.findOne).toHaveBeenCalledWith({ _id: jobId });
      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundError when job not found', async () => {
      const jobId = 'nonexistent123';
      Job.findOne.mockResolvedValue(null);

      await expect(jobService.getJobById(jobId)).rejects.toThrow(NotFoundError);
      await expect(jobService.getJobById(jobId)).rejects.toThrow(`No job with id :${jobId}`);
    });
  });

  describe('updateJob', () => {
    it('should update job successfully', async () => {
      const jobId = 'job123';
      const updates = {
        position: 'Senior Developer',
        company: 'NewCorp',
        status: 'interview',
      };
      const user = { userId: 'user123' };
      const mockJob = {
        _id: jobId,
        createdBy: 'user123',
        position: 'Developer',
      };
      const updatedJob = { ...mockJob, ...updates };

      Job.findOne.mockResolvedValue(mockJob);
      Job.findOneAndUpdate.mockResolvedValue(updatedJob);
      checkPermissions.mockImplementation(() => {}); // Allow

      const result = await jobService.updateJob(jobId, updates, user);

      expect(Job.findOne).toHaveBeenCalledWith({ _id: jobId });
      expect(checkPermissions).toHaveBeenCalledWith(user, mockJob.createdBy);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId },
        expect.objectContaining({
          position: 'Senior Developer',
          company: 'NewCorp',
          status: 'interview',
        }),
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedJob);
    });

    it('should throw BadRequestError when no changes provided', async () => {
      const jobId = 'job123';
      const updates = {};
      const user = { userId: 'user123' };

      await expect(jobService.updateJob(jobId, updates, user)).rejects.toThrow(BadRequestError);
      await expect(jobService.updateJob(jobId, updates, user)).rejects.toThrow(
        'No changes provided',
      );
    });

    it('should throw NotFoundError when job not found', async () => {
      const jobId = 'nonexistent123';
      const updates = { position: 'New Position' };
      const user = { userId: 'user123' };

      Job.findOne.mockResolvedValue(null);

      await expect(jobService.updateJob(jobId, updates, user)).rejects.toThrow(NotFoundError);
    });

    it('should check permissions before updating', async () => {
      const jobId = 'job123';
      const updates = { position: 'New Position' };
      const user = { userId: 'user123' };
      const mockJob = { _id: jobId, createdBy: 'otherUser456' };

      Job.findOne.mockResolvedValue(mockJob);
      checkPermissions.mockImplementation(() => {
        throw new Error('Not authorized');
      });

      await expect(jobService.updateJob(jobId, updates, user)).rejects.toThrow('Not authorized');
      expect(Job.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should clear jobPostingUrl when empty string provided', async () => {
      const jobId = 'job123';
      const updates = {
        position: 'Developer',
        jobPostingUrl: '',
      };
      const user = { userId: 'user123' };
      const mockJob = { _id: jobId, createdBy: 'user123' };

      Job.findOne.mockResolvedValue(mockJob);
      Job.findOneAndUpdate.mockResolvedValue({});

      await jobService.updateJob(jobId, updates, user);

      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: jobId },
        expect.objectContaining({
          jobPostingUrl: '',
        }),
        expect.any(Object),
      );
    });
  });

  describe('deleteJob', () => {
    it('should delete job successfully', async () => {
      const jobId = 'job123';
      const user = { userId: 'user123' };
      const mockJob = {
        _id: jobId,
        createdBy: 'user123',
      };

      Job.findOne.mockResolvedValue(mockJob);
      Job.findOneAndDelete.mockResolvedValue(mockJob);

      await jobService.deleteJob(jobId, user);

      expect(Job.findOne).toHaveBeenCalledWith({ _id: jobId });
      expect(checkPermissions).toHaveBeenCalledWith(user, mockJob.createdBy);
      expect(Job.findOneAndDelete).toHaveBeenCalledWith({ _id: jobId });
    });

    it('should throw NotFoundError when job not found', async () => {
      const jobId = 'nonexistent123';
      const user = { userId: 'user123' };

      Job.findOne.mockResolvedValue(null);

      await expect(jobService.deleteJob(jobId, user)).rejects.toThrow(NotFoundError);
      expect(Job.findOneAndDelete).not.toHaveBeenCalled();
    });

    it('should check permissions before deleting', async () => {
      const jobId = 'job123';
      const user = { userId: 'user123' };
      const mockJob = { _id: jobId, createdBy: 'otherUser456' };

      Job.findOne.mockResolvedValue(mockJob);
      checkPermissions.mockImplementation(() => {
        throw new Error('Not authorized');
      });

      await expect(jobService.deleteJob(jobId, user)).rejects.toThrow('Not authorized');
      expect(Job.findOneAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('getJobStats', () => {
    it('should return job statistics', async () => {
      const userId = 'user123';

      const mockStatusStats = [
        { _id: 'pending', count: 5 },
        { _id: 'interview', count: 3 },
        { _id: 'declined', count: 2 },
      ];

      const mockMonthlyStats = [
        { _id: { year: 2025, month: 11 }, count: 4 },
        { _id: { year: 2025, month: 10 }, count: 3 },
      ];

      Job.aggregate
        .mockResolvedValueOnce(mockStatusStats) // First call for status stats
        .mockResolvedValueOnce(mockMonthlyStats); // Second call for monthly stats

      const result = await jobService.getJobStats(userId);

      expect(mongoose.Types.ObjectId.createFromHexString).toHaveBeenCalledWith(userId);
      expect(result.defaultStats).toEqual({
        pending: 5,
        interview: 3,
        offered: 0,
        accepted: 0,
        declined: 2,
      });
      expect(result.monthlyApplications).toHaveLength(6);
      expect(result.monthlyApplications[0]).toHaveProperty('date');
      expect(result.monthlyApplications[0]).toHaveProperty('count');
    });

    it('should return zeros for missing statuses', async () => {
      const userId = 'user123';

      Job.aggregate
        .mockResolvedValueOnce([]) // No stats
        .mockResolvedValueOnce([]); // No monthly data

      const result = await jobService.getJobStats(userId);

      expect(mongoose.Types.ObjectId.createFromHexString).toHaveBeenCalledWith(userId);
      expect(result.defaultStats).toEqual({
        pending: 0,
        interview: 0,
        offered: 0,
        accepted: 0,
        declined: 0,
      });
    });

    it('should fill missing months with zeros', async () => {
      const userId = 'user123';

      Job.aggregate.mockResolvedValueOnce([{ _id: 'pending', count: 1 }]).mockResolvedValueOnce([]); // No monthly data

      const result = await jobService.getJobStats(userId);

      expect(mongoose.Types.ObjectId.createFromHexString).toHaveBeenCalledWith(userId);
      expect(result.monthlyApplications).toHaveLength(6);
      expect(result.monthlyApplications.every((month) => month.count === 0)).toBe(true);
    });
  });
});
