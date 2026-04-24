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

const createMockJobRepository = () => ({
  create: jest.fn(),
  count: jest.fn(),
  findWithPagination: jest.fn(),
  updateById: jest.fn(),
  findById: jest.fn(),
  deleteById: jest.fn(),
  getStatusDistributionForUser: jest.fn(),
  getMonthlyCountsForUser: jest.fn(),
});

describe('Job Service', () => {
  let jobService;
  let mockJobRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJobRepository = createMockJobRepository();
    jobService = createJobService({ jobRepository: mockJobRepository });
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

      mockJobRepository.create.mockResolvedValue(mockCreatedJob);

      const result = await jobService.createJob(jobData, userId);

      expect(mockJobRepository.create).toHaveBeenCalledWith({
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
      mockJobRepository.create.mockResolvedValue(mockCreatedJob);

      const result = await jobService.createJob(jobData, userId);

      expect(mockJobRepository.create).toHaveBeenCalledWith(
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

      mockJobRepository.create.mockRejectedValue(new Error('Database error'));

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

      mockJobRepository.count.mockResolvedValue(2);
      mockJobRepository.findWithPagination.mockResolvedValue(mockJobs);

      const result = await jobService.getAllJobs(userId, filters);

      expect(mockJobRepository.count).toHaveBeenCalledWith({ createdBy: userId });
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

      mockJobRepository.count.mockResolvedValue(0);

      const result = await jobService.getAllJobs(userId, filters);

      expect(result).toEqual({
        jobs: [],
        page: 1,
        numOfPages: 0,
        totalJobs: 0,
      });
      expect(mockJobRepository.findWithPagination).not.toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      const userId = 'user123';
      const filters = {
        search: 'developer',
        page: 1,
        limit: 10,
      };

      const mockJobs = [{ _id: 'job1', position: 'Developer' }];

      mockJobRepository.count.mockResolvedValue(1);
      mockJobRepository.findWithPagination.mockResolvedValue(mockJobs);

      await jobService.getAllJobs(userId, filters);

      expect(mockJobRepository.count).toHaveBeenCalledWith({
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

      mockJobRepository.count.mockResolvedValue(5);
      mockJobRepository.findWithPagination.mockResolvedValue([]);

      await jobService.getAllJobs(userId, filters);

      expect(mockJobRepository.count).toHaveBeenCalledWith({
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

      mockJobRepository.count.mockResolvedValue(3);
      mockJobRepository.findWithPagination.mockResolvedValue([]);

      await jobService.getAllJobs(userId, filters);

      expect(mockJobRepository.count).toHaveBeenCalledWith({
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

      mockJobRepository.count.mockResolvedValue(20); // Only 2 pages available

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

      mockJobRepository.count.mockResolvedValue(5);
      const mockSort = jest.fn();
      mockJobRepository.findWithPagination.mockImplementation(() => {
        mockSort('position');
        return [];
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

      mockJobRepository.findById.mockResolvedValue(mockJob);

      const result = await jobService.getJobById(jobId);

      expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundError when job not found', async () => {
      const jobId = 'nonexistent123';
      mockJobRepository.findById.mockResolvedValue(null);

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

      mockJobRepository.findById.mockResolvedValue(mockJob);
      mockJobRepository.updateById.mockResolvedValue(updatedJob);
      checkPermissions.mockImplementation(() => {}); // Allow

      const result = await jobService.updateJob(jobId, updates, user);

      expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
      expect(checkPermissions).toHaveBeenCalledWith(user, mockJob.createdBy);
      expect(mockJobRepository.updateById).toHaveBeenCalledWith(jobId, {
        position: 'Senior Developer',
        company: 'NewCorp',
        status: 'interview',
      });
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

      mockJobRepository.findById.mockResolvedValue(null);

      await expect(jobService.updateJob(jobId, updates, user)).rejects.toThrow(NotFoundError);
    });

    it('should check permissions before updating', async () => {
      const jobId = 'job123';
      const updates = { position: 'New Position' };
      const user = { userId: 'user123' };
      const mockJob = { _id: jobId, createdBy: 'otherUser456' };

      mockJobRepository.findById.mockResolvedValue(mockJob);
      checkPermissions.mockImplementation(() => {
        throw new Error('Not authorized');
      });

      await expect(jobService.updateJob(jobId, updates, user)).rejects.toThrow('Not authorized');
      expect(mockJobRepository.updateById).not.toHaveBeenCalled();
    });

    it('should clear jobPostingUrl when empty string provided', async () => {
      const jobId = 'job123';
      const updates = {
        position: 'Developer',
        jobPostingUrl: '',
      };
      const user = { userId: 'user123' };
      const mockJob = { _id: jobId, createdBy: 'user123' };

      mockJobRepository.findById.mockResolvedValue(mockJob);
      mockJobRepository.updateById.mockResolvedValue({});

      await jobService.updateJob(jobId, updates, user);

      expect(mockJobRepository.updateById).toHaveBeenCalledWith(
        jobId,
        expect.objectContaining({
          jobPostingUrl: '',
        }),
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

      mockJobRepository.findById.mockResolvedValue(mockJob);
      mockJobRepository.deleteById.mockResolvedValue(mockJob);

      await jobService.deleteJob(jobId, user);

      expect(mockJobRepository.findById).toHaveBeenCalledWith(jobId);
      expect(checkPermissions).toHaveBeenCalledWith(user, mockJob.createdBy);
      expect(mockJobRepository.deleteById).toHaveBeenCalledWith(jobId);
    });

    it('should throw NotFoundError when job not found', async () => {
      const jobId = 'nonexistent123';
      const user = { userId: 'user123' };

      mockJobRepository.findById.mockResolvedValue(null);

      await expect(jobService.deleteJob(jobId, user)).rejects.toThrow(NotFoundError);
      expect(mockJobRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should check permissions before deleting', async () => {
      const jobId = 'job123';
      const user = { userId: 'user123' };
      const mockJob = { _id: jobId, createdBy: 'otherUser456' };

      mockJobRepository.findById.mockResolvedValue(mockJob);
      checkPermissions.mockImplementation(() => {
        throw new Error('Not authorized');
      });

      await expect(jobService.deleteJob(jobId, user)).rejects.toThrow('Not authorized');
      expect(mockJobRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('getJobStats', () => {
    it('should return job statistics', async () => {
      const userId = 'user123';
      const mockStatusStats = {
        pending: 5,
        interview: 3,
        offered: 0,
        accepted: 0,
        declined: 2,
      };
      const mockMonthlyStats = [
        { date: '2025-11', count: 4 },
        { date: '2025-10', count: 3 },
        { date: '2025-09', count: 0 },
        { date: '2025-08', count: 0 },
        { date: '2025-07', count: 0 },
        { date: '2025-06', count: 0 },
      ];
      mockJobRepository.getStatusDistributionForUser.mockResolvedValue(mockStatusStats);
      mockJobRepository.getMonthlyCountsForUser.mockResolvedValue(mockMonthlyStats);

      const result = await jobService.getJobStats(userId);

      expect(mockJobRepository.getStatusDistributionForUser).toHaveBeenCalledWith(userId);
      expect(mockJobRepository.getMonthlyCountsForUser).toHaveBeenCalledWith(
        userId,
        expect.any(Number),
      );
      expect(result.defaultStats).toEqual(mockStatusStats);
      expect(result.monthlyApplications).toEqual(mockMonthlyStats);
    });

    it('should return zeros for missing statuses', async () => {
      const userId = 'user123';
      const emptyStats = {
        pending: 0,
        interview: 0,
        offered: 0,
        accepted: 0,
        declined: 0,
      };
      mockJobRepository.getStatusDistributionForUser.mockResolvedValue(emptyStats);
      mockJobRepository.getMonthlyCountsForUser.mockResolvedValue([]);

      const result = await jobService.getJobStats(userId);

      expect(mockJobRepository.getStatusDistributionForUser).toHaveBeenCalledWith(userId);
      expect(result.defaultStats).toEqual(emptyStats);
    });

    it('should fill missing months with zeros', async () => {
      const userId = 'user123';
      const statusStats = {
        pending: 1,
        interview: 0,
        offered: 0,
        accepted: 0,
        declined: 0,
      };
      // Simulate 6 months, all zero
      const monthlyStats = Array.from({ length: 6 }, (_, i) => ({
        date: `2025-0${i + 1}`,
        count: 0,
      }));
      mockJobRepository.getStatusDistributionForUser.mockResolvedValue(statusStats);
      mockJobRepository.getMonthlyCountsForUser.mockResolvedValue(monthlyStats);

      const result = await jobService.getJobStats(userId);

      expect(mockJobRepository.getMonthlyCountsForUser).toHaveBeenCalledWith(
        userId,
        expect.any(Number),
      );
      expect(result.monthlyApplications).toHaveLength(6);
      expect(result.monthlyApplications.every((month) => month.count === 0)).toBe(true);
    });
  });
});
