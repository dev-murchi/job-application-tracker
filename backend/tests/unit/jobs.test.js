const { BadRequestError, NotFoundError } = require('../../errors');

// Mock services BEFORE requiring anything else
jest.mock('../../services', () => ({
  jobService: {
    createJob: jest.fn(),
    getAllJobs: jest.fn(),
    getJobById: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    getJobStats: jest.fn(),
  },
}));

const { jobService } = require('../../services');

const { jobsController } = require('../../controllers');
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
      jobService.createJob.mockResolvedValue(mockJob);

      await jobsController.createJob(req, res);

      expect(jobService.createJob).toHaveBeenCalledWith(req.body, 'user123');
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
      jobService.createJob.mockResolvedValue(mockJob);

      await jobsController.createJob(req, res);

      expect(jobService.createJob).toHaveBeenCalledWith(req.body, 'user123');
      expect(res.status).toHaveBeenCalledWith(201);
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
      jobService.createJob.mockResolvedValue(mockJob);

      await jobsController.createJob(req, res);

      expect(jobService.createJob).toHaveBeenCalledWith(req.body, 'user123');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getAllJobs', () => {
    const mockJobs = [
      { _id: '1', position: 'Engineer', company: 'A Corp' },
      { _id: '2', position: 'Designer', company: 'B Corp' },
    ];

    beforeEach(() => {
      req.query = { page: 1, limit: 10, sort: 'newest' };
    });

    it('should return all jobs with default pagination', async () => {
      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should filter jobs by status', async () => {
      req.query = { status: 'interview', page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: [mockJobs[0]],
        page: 1,
        numOfPages: 1,
        totalJobs: 1,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should filter jobs by jobType', async () => {
      req.query = { jobType: 'full-time', page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: [mockJobs[0]],
        page: 1,
        numOfPages: 1,
        totalJobs: 1,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should search jobs by position', async () => {
      req.query = { search: 'engineer', page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: [mockJobs[0]],
        page: 1,
        numOfPages: 1,
        totalJobs: 1,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should sort jobs by newest (default)', async () => {
      req.query = { page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should sort jobs by oldest', async () => {
      req.query = { sort: 'oldest', page: 1, limit: 10 };

      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should sort jobs alphabetically (a-z)', async () => {
      req.query = { sort: 'a-z', page: 1, limit: 10 };

      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should sort jobs reverse alphabetically (z-a)', async () => {
      req.query = { sort: 'z-a', page: 1, limit: 10 };

      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should handle pagination correctly', async () => {
      req.query = { page: 2, limit: 5, sort: 'newest' };

      const mockResult = {
        jobs: mockJobs,
        page: 2,
        numOfPages: 3,
        totalJobs: 12,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return empty array when no jobs exist', async () => {
      req.query = { page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: [],
        page: 1,
        numOfPages: 0,
        totalJobs: 0,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should throw BadRequestError when page is out of range', async () => {
      req.query = { page: 5, limit: 10, sort: 'newest' };

      jobService.getAllJobs.mockRejectedValue(new BadRequestError('Requested page does not exist'));

      await expect(jobsController.getAllJobs(req, res)).rejects.toThrow(BadRequestError);
      await expect(jobsController.getAllJobs(req, res)).rejects.toThrow(
        'Requested page does not exist',
      );
    });

    it('should ignore status filter when set to "all"', async () => {
      req.query = { status: 'all', page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });

    it('should ignore jobType filter when set to "all"', async () => {
      req.query = { jobType: 'all', page: 1, limit: 10, sort: 'newest' };

      const mockResult = {
        jobs: mockJobs,
        page: 1,
        numOfPages: 1,
        totalJobs: 2,
      };

      jobService.getAllJobs.mockResolvedValue(mockResult);

      await jobsController.getAllJobs(req, res);

      expect(jobService.getAllJobs).toHaveBeenCalledWith('user123', req.query);
    });
  });

  describe('updateJob', () => {
    const jobId = 'job123';

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

      const updatedJob = { _id: jobId, ...req.body, createdBy: 'user123' };
      jobService.updateJob.mockResolvedValue(updatedJob);

      await jobsController.updateJob(req, res);

      expect(jobService.updateJob).toHaveBeenCalledWith(jobId, req.body, req.user);
      expect(res.json).toHaveBeenCalledWith({ job: updatedJob });
    });

    it('should throw BadRequestError when no changes provided', async () => {
      req.body = {};

      jobService.updateJob.mockRejectedValue(new BadRequestError('No changes provided'));

      await expect(jobsController.updateJob(req, res)).rejects.toThrow(BadRequestError);
      await expect(jobsController.updateJob(req, res)).rejects.toThrow('No changes provided');
    });

    it('should throw NotFoundError when job does not exist', async () => {
      req.body = { company: 'New Corp' };

      jobService.updateJob.mockRejectedValue(new NotFoundError(`No job with id :${jobId}`));

      await expect(jobsController.updateJob(req, res)).rejects.toThrow(NotFoundError);
      await expect(jobsController.updateJob(req, res)).rejects.toThrow(`No job with id :${jobId}`);
    });

    it('should update job with optional jobPostingUrl', async () => {
      req.body = {
        company: 'New Corp',
        jobPostingUrl: 'https://newcorp.com/job/123',
      };

      const updatedJob = { _id: jobId, ...req.body };
      jobService.updateJob.mockResolvedValue(updatedJob);

      await jobsController.updateJob(req, res);

      expect(jobService.updateJob).toHaveBeenCalledWith(jobId, req.body, req.user);
      expect(res.json).toHaveBeenCalledWith({ job: updatedJob });
    });

    it('should clear jobPostingUrl when empty string is provided', async () => {
      req.body = {
        company: 'New Corp',
        jobPostingUrl: '',
      };

      const updatedJob = { _id: jobId, ...req.body };
      jobService.updateJob.mockResolvedValue(updatedJob);

      await jobsController.updateJob(req, res);

      expect(jobService.updateJob).toHaveBeenCalledWith(jobId, req.body, req.user);
    });

    it('should check permissions before updating', async () => {
      req.body = { company: 'New Corp' };

      const secondUserReq = {
        ...req,
        user: { userId: 'user999' },
      };

      jobService.updateJob.mockRejectedValue(new Error('Not authorized to access this route'));

      await expect(jobsController.updateJob(secondUserReq, res)).rejects.toThrow(
        'Not authorized to access this route',
      );
    });
  });

  describe('deleteJob', () => {
    const jobId = 'job123';

    beforeEach(() => {
      req.params = { id: jobId };
    });

    it('should delete a job successfully', async () => {
      jobService.deleteJob.mockResolvedValue();

      await jobsController.deleteJob(req, res);

      expect(jobService.deleteJob).toHaveBeenCalledWith(jobId, req.user);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Success! Job removed' });
    });

    it('should throw NotFoundError when job does not exist', async () => {
      jobService.deleteJob.mockRejectedValue(new NotFoundError(`No job with id :${jobId}`));

      await expect(jobsController.deleteJob(req, res)).rejects.toThrow(NotFoundError);
      await expect(jobsController.deleteJob(req, res)).rejects.toThrow(`No job with id :${jobId}`);
    });

    it('should check permissions before deleting', async () => {
      jobService.deleteJob.mockRejectedValue(new Error('Not authorized to access this route'));

      await expect(jobsController.deleteJob(req, res)).rejects.toThrow(
        'Not authorized to access this route',
      );
    });
  });

  describe('showStats', () => {
    const userId = 'user123';

    beforeEach(() => {
      req.user = { userId };
    });

    it('should return job statistics and monthly applications', async () => {
      const mockStats = {
        defaultStats: {
          pending: 5,
          interview: 3,
          offered: 0,
          accepted: 0,
          declined: 2,
        },
        monthlyApplications: [
          { date: '2024-08', count: 3 },
          { date: '2024-09', count: 5 },
          { date: '2024-10', count: 4 },
          { date: '2024-11', count: 1 },
        ],
      };

      jobService.getJobStats.mockResolvedValue(mockStats);

      await jobsController.showStats(req, res);

      expect(jobService.getJobStats).toHaveBeenCalledWith(userId);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it('should return zero stats when no jobs exist', async () => {
      const mockStats = {
        defaultStats: {
          pending: 0,
          interview: 0,
          offered: 0,
          accepted: 0,
          declined: 0,
        },
        monthlyApplications: expect.any(Array),
      };

      jobService.getJobStats.mockResolvedValue(mockStats);

      await jobsController.showStats(req, res);

      expect(jobService.getJobStats).toHaveBeenCalledWith(userId);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    it('should fill missing months with zero count', async () => {
      const mockStats = {
        defaultStats: {
          pending: 1,
          interview: 0,
          offered: 0,
          accepted: 0,
          declined: 0,
        },
        monthlyApplications: [
          { date: '2024-06', count: 0 },
          { date: '2024-07', count: 0 },
          { date: '2024-08', count: 0 },
          { date: '2024-09', count: 0 },
          { date: '2024-10', count: 1 },
          { date: '2024-11', count: 0 },
        ],
      };

      jobService.getJobStats.mockResolvedValue(mockStats);

      await jobsController.showStats(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.monthlyApplications).toHaveLength(6);
      expect(result.monthlyApplications.some((m) => m.count === 0)).toBe(true);
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
      jobService.getJobById.mockResolvedValue(mockJob);

      await jobsController.getJob(req, res);

      expect(jobService.getJobById).toHaveBeenCalledWith(jobId);
      expect(res.json).toHaveBeenCalledWith({ job: mockJob });
    });

    it('should throw NotFoundError when job does not exist', async () => {
      jobService.getJobById.mockRejectedValue(new NotFoundError(`No job with id :${jobId}`));

      await expect(jobsController.getJob(req, res)).rejects.toThrow(NotFoundError);
      await expect(jobsController.getJob(req, res)).rejects.toThrow(`No job with id :${jobId}`);
    });
  });
});
