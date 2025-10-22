const request = require('supertest');
const {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  seedTestJobs,
  createTestJob,
  generateTestToken,
  createTestCookie,
  getAllJobs,
  countDocuments,
  deleteTestJob,
} = require('./setup.integration');

describe('Jobs Integration Tests', () => {
  let app;
  let connectionManager;
  let connection;
  let testUser;
  let authToken;
  let authCookie;
  let nonExistJob;

  beforeAll(async () => {
    // Create isolated mongoose connection
    const testConnection = await createTestConnection('jobsIntegration');
    connection = testConnection.connection;
    connectionManager = testConnection.connectionManager;

    // Require app.js after connection is established
    app = require('../../app').app;
  });

  afterAll(async () => {
    // Close connection using connection manager
    await closeTestConnection(connection, connectionManager);
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase(connection);

    // Create test user and auth token for authenticated requests
    testUser = await seedTestUser({
      name: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      location: 'Test City',
    });

    // create and delete a job to as non-exist job
    nonExistJob = await createTestJob(testUser._id, {
      company: 'None Exist Corp',
      position: 'Software Engineer',
      status: 'pending',
      jobType: 'full-time',
      jobLocation: 'Remote',
      companyWebsite: 'https://nonexistcorp.com',
    });

    await deleteTestJob(nonExistJob._id);

    authToken = generateTestToken(testUser);
    authCookie = createTestCookie(authToken);
  });

  describe('POST /api/v1/jobs', () => {
    it('should create a new job with valid data', async () => {
      const jobData = {
        company: 'Tech Corp',
        position: 'Software Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://techcorp.com',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(jobData)
        .expect(201);

      expect(response.body.job).toMatchObject({
        company: 'Tech Corp',
        position: 'Software Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://techcorp.com',
      });

      expect(response.body.job).toHaveProperty('_id');
      expect(response.body.job).toHaveProperty('createdAt');
      expect(response.body.job.createdBy).toBe(testUser._id.toString());

      // Verify job is in database
      const jobCount = await countDocuments('Job');
      expect(jobCount).toBe(1);
    });

    it('should create a job with optional jobPostingUrl', async () => {
      const jobData = {
        company: 'StartUp Inc',
        position: 'Developer',
        status: 'interview',
        jobType: 'part-time',
        jobLocation: 'NYC',
        companyWebsite: 'https://startup.com',
        jobPostingUrl: 'https://startup.com/careers/123',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(jobData)
        .expect(201);

      expect(response.body.job.jobPostingUrl).toBe(
        'https://startup.com/careers/123'
      );
    });

    it('should reject job creation without authentication', async () => {
      const jobData = {
        company: 'Tech Corp',
        position: 'Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://techcorp.com',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .send(jobData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication Invalid');

      const jobCount = await countDocuments('Job');
      expect(jobCount).toBe(0);
    });

    it('should reject job creation with missing company', async () => {
      const jobData = {
        position: 'Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://techcorp.com',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('company');
    });

    it('should reject job creation with invalid companyWebsite URL', async () => {
      const jobData = {
        company: 'Tech Corp',
        position: 'Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'not-a-url',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject job creation with invalid status', async () => {
      const jobData = {
        company: 'Tech Corp',
        position: 'Engineer',
        status: 'invalid-status',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://techcorp.com',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject job creation with invalid jobType', async () => {
      const jobData = {
        company: 'Tech Corp',
        position: 'Engineer',
        status: 'pending',
        jobType: 'invalid-type',
        jobLocation: 'Remote',
        companyWebsite: 'https://techcorp.com',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(jobData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/jobs', () => {
    beforeEach(async () => {
      // Seed test jobs
      await seedTestJobs(testUser._id, 15);
    });

    it('should get all jobs for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.jobs).toHaveLength(10); // Default limit is 10
      expect(response.body.page).toBe(1);
      expect(response.body.totalJobs).toBe(15);
      expect(response.body.numOfPages).toBe(2);
    });

    it('should reject getting jobs without authentication', async () => {
      const response = await request(app).get('/api/v1/jobs').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication Invalid');
    });

    it('should filter jobs by status', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?status=pending')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.jobs.every((job) => job.status === 'pending')).toBe(
        true
      );
    });

    it('should filter jobs by jobType', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?jobType=full-time')
        .set('Cookie', authCookie)
        .expect(200);

      expect(
        response.body.jobs.every((job) => job.jobType === 'full-time')
      ).toBe(true);
    });

    it('should search jobs by position', async () => {
      await createTestJob(testUser._id, {
        company: 'Search Corp',
        position: 'Senior Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://search.com',
      });

      const response = await request(app)
        .get('/api/v1/jobs?search=Senior')
        .set('Cookie', authCookie)
        .expect(200);

      expect(
        response.body.jobs.some((job) => job.position.includes('Senior'))
      ).toBe(true);
    });

    it('should search jobs by company', async () => {
      await createTestJob(testUser._id, {
        company: 'Google',
        position: 'Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://google.com',
      });

      const response = await request(app)
        .get('/api/v1/jobs?search=Google')
        .set('Cookie', authCookie)
        .expect(200);

      expect(
        response.body.jobs.some((job) => job.company.includes('Google'))
      ).toBe(true);
    });

    it('should sort jobs by newest (default)', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Cookie', authCookie)
        .expect(200);

      const jobs = response.body.jobs;
      for (let i = 0; i < jobs.length - 1; i++) {
        const current = new Date(jobs[i].createdAt);
        const next = new Date(jobs[i + 1].createdAt);
        expect(current >= next).toBe(true);
      }
    });

    it('should sort jobs by oldest', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?sort=oldest')
        .set('Cookie', authCookie)
        .expect(200);

      const jobs = response.body.jobs;
      for (let i = 0; i < jobs.length - 1; i++) {
        const current = new Date(jobs[i].createdAt);
        const next = new Date(jobs[i + 1].createdAt);
        expect(current <= next).toBe(true);
      }
    });

    it('should sort jobs alphabetically (a-z)', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?sort=a-z')
        .set('Cookie', authCookie)
        .expect(200);

      const jobs = response.body.jobs;
      for (let i = 0; i < jobs.length - 1; i++) {
        expect(
          jobs[i].position.localeCompare(jobs[i + 1].position)
        ).toBeLessThanOrEqual(0);
      }
    });

    it('should sort jobs reverse alphabetically (z-a)', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?sort=z-a')
        .set('Cookie', authCookie)
        .expect(200);

      const jobs = response.body.jobs;
      for (let i = 0; i < jobs.length - 1; i++) {
        expect(
          jobs[i].position.localeCompare(jobs[i + 1].position)
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it('should paginate jobs correctly', async () => {
      const page1 = await request(app)
        .get('/api/v1/jobs?page=1&limit=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(page1.body.jobs).toHaveLength(5);
      expect(page1.body.page).toBe(1);
      expect(page1.body.numOfPages).toBe(3);

      const page2 = await request(app)
        .get('/api/v1/jobs?page=2&limit=5')
        .set('Cookie', authCookie)
        .expect(200);

      expect(page2.body.jobs).toHaveLength(5);
      expect(page2.body.page).toBe(2);

      // Verify different jobs on different pages
      expect(page1.body.jobs[0]._id).not.toBe(page2.body.jobs[0]._id);
    });

    it('should reject page number out of range', async () => {
      const response = await request(app)
        .get('/api/v1/jobs?page=999')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('page does not exist');
    });

    it('should return empty array when user has no jobs', async () => {
      // await clearDatabase(connection);

      const newUser = await seedTestUser({
        name: 'Empty',
        lastName: 'User',
        email: 'empty@example.com',
        password: 'password123',
        location: 'City',
      });

      const newToken = generateTestToken(newUser);
      const newCookie = createTestCookie(newToken);

      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Cookie', newCookie)
        .expect(200);

      expect(response.body.jobs).toEqual([]);
      expect(response.body.totalJobs).toBe(0);
      expect(response.body.numOfPages).toBe(0);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get(
          '/api/v1/jobs?status=pending&jobType=full-time&sort=a-z&page=1&limit=5'
        )
        .set('Cookie', authCookie)
        .expect(200);

      expect(
        response.body.jobs.every(
          (job) => job.status === 'pending' && job.jobType === 'full-time'
        )
      ).toBe(true);
      expect(response.body.jobs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await createTestJob(testUser._id, {
        company: 'Get Corp',
        position: 'Get Position',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://get.com',
      });
    });

    it('should get a specific job by id', async () => {
      const response = await request(app)
        .get(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.job).toMatchObject({
        _id: testJob._id.toString(),
        company: 'Get Corp',
        position: 'Get Position',
        status: 'pending',
      });
    });

    it('should reject getting job without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/jobs/${testJob._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent job id', async () => {
      const fakeId = nonExistJob._id; //'507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/v1/jobs/${fakeId}`)
        .set('Cookie', authCookie)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No job with id');
    });

    it('should reject invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/invalid-id')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/jobs/:id', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await createTestJob(testUser._id, {
        company: 'Old Corp',
        position: 'Old Position',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Old City',
        companyWebsite: 'https://old.com',
      });
    });

    it('should update a job with valid data', async () => {
      const updateData = {
        company: 'New Corp',
        position: 'New Position',
        status: 'interview',
        jobType: 'part-time',
        jobLocation: 'New City',
        companyWebsite: 'https://new.com',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.job).toMatchObject({
        company: 'New Corp',
        position: 'New Position',
        status: 'interview',
        jobType: 'part-time',
        jobLocation: 'New City',
        companyWebsite: 'https://new.com',
      });
    });

    it('should update only specified fields', async () => {
      const updateData = {
        status: 'declined',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.job.status).toBe('declined');
      expect(response.body.job.company).toBe('Old Corp'); // Should remain unchanged
      expect(response.body.job.position).toBe('Old Position'); // Should remain unchanged
    });

    it('should update job with jobPostingUrl', async () => {
      const updateData = {
        company: 'Corp',
        jobPostingUrl: 'https://newcorp.com/job/123',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.job.jobPostingUrl).toBe(
        'https://newcorp.com/job/123'
      );
    });

    it('should clear jobPostingUrl with empty string', async () => {
      const updateData = {
        company: 'Corp',
        jobPostingUrl: '',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.job.jobPostingUrl).toBe('');
    });

    it('should not clear jobLocation', async () => {
      const updateData = {
        company: 'Corp',
        jobLocation: '',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Job location is required');
    });

    it('should reject update without authentication', async () => {
      const updateData = { company: 'New Corp' };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update with no changes provided', async () => {
      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No changes provided');
    });

    it('should reject update for non-existent job', async () => {
      const fakeId = nonExistJob._id; //'507f1f77bcf86cd799439011';
      const updateData = { company: 'New Corp' };

      const response = await request(app)
        .patch(`/api/v1/jobs/${fakeId}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No job with id');
    });

    it('should reject update from unauthorized user', async () => {
      // Create another user
      const otherUser = await seedTestUser({
        name: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        location: 'City',
      });

      const otherToken = generateTestToken(otherUser);
      const otherCookie = createTestCookie(otherToken);

      const updateData = { company: 'Hacked Corp' };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', otherCookie)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid status', async () => {
      const updateData = {
        company: 'Corp',
        status: 'invalid-status',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid job type', async () => {
      const updateData = {
        company: 'Corp',
        jobType: 'invalid-type',
      };

      const response = await request(app)
        .patch(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/jobs/:id', () => {
    let testJob;

    beforeEach(async () => {
      testJob = await createTestJob(testUser._id, {
        company: 'Delete Corp',
        position: 'Delete Position',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://delete.com',
      });
    });

    it('should delete a job', async () => {
      const response = await request(app)
        .delete(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.msg).toBe('Success! Job removed');

      // Verify job is deleted from database
      const jobs = await getAllJobs(testUser._id);
      expect(
        jobs.find((job) => job._id.toString() === testJob._id.toString())
      ).toBeUndefined();
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/jobs/${testJob._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verify job still exists
      const jobs = await getAllJobs(testUser._id);
      expect(
        jobs.find((job) => job._id.toString() === testJob._id.toString())
      ).toBeDefined();
    });

    it('should reject deletion for non-existent job', async () => {
      const fakeId = nonExistJob._id; //'507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/v1/jobs/${fakeId}`)
        .set('Cookie', authCookie)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No job with id');
    });

    it('should reject deletion from unauthorized user', async () => {
      // Create another user
      const otherUser = await seedTestUser({
        name: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        location: 'City',
      });

      const otherToken = generateTestToken(otherUser);
      const otherCookie = createTestCookie(otherToken);

      const response = await request(app)
        .delete(`/api/v1/jobs/${testJob._id}`)
        .set('Cookie', otherCookie)
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verify job still exists
      const jobs = await getAllJobs(testUser._id);
      expect(
        jobs.find((job) => job._id.toString() === testJob._id.toString())
      ).toBeDefined();
    });
  });

  describe('GET /api/v1/jobs/stats', () => {
    beforeEach(async () => {
      // Create jobs with different statuses
      await createTestJob(testUser._id, {
        company: 'A',
        position: 'P1',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'R',
        companyWebsite: 'https://a.com',
      });
      await createTestJob(testUser._id, {
        company: 'B',
        position: 'P2',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'R',
        companyWebsite: 'https://b.com',
      });
      await createTestJob(testUser._id, {
        company: 'C',
        position: 'P3',
        status: 'interview',
        jobType: 'full-time',
        jobLocation: 'R',
        companyWebsite: 'https://c.com',
      });
      await createTestJob(testUser._id, {
        company: 'D',
        position: 'P4',
        status: 'declined',
        jobType: 'full-time',
        jobLocation: 'R',
        companyWebsite: 'https://d.com',
      });
      await createTestJob(testUser._id, {
        company: 'E',
        position: 'P5',
        status: 'offered',
        jobType: 'full-time',
        jobLocation: 'R',
        companyWebsite: 'https://e.com',
      });
    });

    it('should return job statistics', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/stats')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.defaultStats).toMatchObject({
        pending: 2,
        interview: 1,
        declined: 1,
        offered: 1,
        accepted: 0,
      });
      expect(response.body.monthlyApplications).toBeDefined();
      expect(Array.isArray(response.body.monthlyApplications)).toBe(true);
      expect(response.body.monthlyApplications.length).toBe(6); // Last 6 months
      response.body.monthlyApplications.forEach((month) => {
        expect(month).toHaveProperty('date');
        expect(month).toHaveProperty('count');
        expect(typeof month.count).toBe('number');
      });
    });

    it('should reject stats request without authentication', async () => {
      const response = await request(app).get('/api/v1/jobs/stats').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return zero stats when user has no jobs', async () => {
      await clearDatabase(connection);

      const newUser = await seedTestUser({
        name: 'Empty',
        lastName: 'User',
        email: 'empty@example.com',
        password: 'password123',
        location: 'City',
      });

      const newToken = generateTestToken(newUser);
      const newCookie = createTestCookie(newToken);

      const response = await request(app)
        .get('/api/v1/jobs/stats')
        .set('Cookie', newCookie)
        .expect(200);

      expect(response.body.defaultStats).toMatchObject({
        pending: 0,
        interview: 0,
        declined: 0,
        offered: 0,
        accepted: 0,
      });
    });
  });

  describe('Jobs Integration - Complete CRUD Flow', () => {
    it('should complete full create -> read -> update -> delete flow', async () => {
      // Step 1: Create job
      const createData = {
        company: 'Flow Corp',
        position: 'Flow Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://flow.com',
      };

      const createResponse = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(createData)
        .expect(201);

      const jobId = createResponse.body.job._id;

      // Step 2: Read job
      const readResponse = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(readResponse.body.job.company).toBe('Flow Corp');

      // Step 3: Update job
      const updateData = {
        company: 'Flow Corp',
        status: 'interview',
      };

      const updateResponse = await request(app)
        .patch(`/api/v1/jobs/${jobId}`)
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.job.status).toBe('interview');

      // Step 4: Delete job
      await request(app)
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Step 5: Verify deletion
      await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Cookie', authCookie)
        .expect(404);
    });
  });
});
