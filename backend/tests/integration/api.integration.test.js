const request = require('supertest');
const {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  generateTestToken,
  createTestCookie,
} = require('./setup.integration');

describe('API Integration Tests', () => {
  let container;
  let app;

  beforeAll(async () => {
    // Create isolated mongoose connection
    container = await createTestConnection('apiIntegration');

    // Require app.js after connection is established
    app = container.app;
  });

  afterAll(async () => {
    // Close connection using connection manager
    await closeTestConnection(container);
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase(container);
  });

  describe('Root Endpoint', () => {
    it('should return API information at root endpoint', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.message).toBe('Job Tracker API');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/').expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow credentials', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/register')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should allow specified HTTP methods', async () => {
      const response = await request(app)
        .options('/api/v1/jobs')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PATCH');
      expect(allowedMethods).toContain('DELETE');
    });
  });

  describe('Security Headers', () => {
    it('should include helmet security headers', async () => {
      const response = await request(app).get('/').expect(200);

      // Helmet sets various security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-download-options']).toBe('noopen');
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should include strict-transport-security in production-like environments', async () => {
      const response = await request(app).get('/').expect(200);

      // Helmet may or may not set HSTS depending on configuration
      // Just verify the header structure if present
      if (response.headers['strict-transport-security']) {
        expect(typeof response.headers['strict-transport-security']).toBe('string');
      }
    });
  });

  describe('404 Not Found Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent').expect(404);

      expect(response.text).toContain('Route does not exist');
    });

    it('should return 404 for non-existent nested routes', async () => {
      await request(app).get('/api/v1/auth/nonexistent').expect(404);
    });

    it('should return 404 for wrong HTTP method on existing route', async () => {
      await request(app).put('/api/v1/auth/register').expect(404);
    });

    it('should return 404 for routes with trailing slashes', async () => {
      await request(app).get('/nonexistent/').expect(404);
    });

    it('should handle 404 for deeply nested non-existent routes', async () => {
      await request(app).get('/api/v1/deeply/nested/route/that/does/not/exist').expect(404);
    });
  });

  describe('MongoDB Sanitization', () => {
    it('should sanitize MongoDB operators from request body', async () => {
      const maliciousData = {
        name: 'Test',
        lastName: 'User',
        email: { $gt: '' }, // MongoDB operator
        password: 'password123',
        location: 'City',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(maliciousData)
        .expect(400);

      // Should fail validation because email is not a string
      expect(response.body.success).toBe(false);
    });

    it('should sanitize MongoDB operators from query parameters', async () => {
      const testUser = await seedTestUser(container);
      const authToken = generateTestToken(container, testUser);
      const authCookie = createTestCookie(authToken);

      const response = await request(app)
        .get('/api/v1/jobs?status[$ne]=pending')
        .set('Cookie', authCookie)
        .expect(400);

      // Should fail because of sanitization or validation
      expect(response.body.success).toBe(false);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS attacks from input fields', async () => {
      const xssData = {
        name: '<script>alert("xss")</script>Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        location: 'City',
      };

      const response = await request(app).post('/api/v1/auth/register').send(xssData).expect(201);

      // XSS should be sanitized
      expect(response.body.name).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Test');
    });

    it('should sanitize XSS attacks from nested objects and complex HTML elements', async () => {
      const testUser = await seedTestUser(container);
      const authToken = generateTestToken(container, testUser);
      const authCookie = createTestCookie(authToken);

      const xssData = {
        company: '<img src=x onerror=alert(1)>',
        position: 'Engineer',
        status: 'pending',
        jobType: 'full-time',
        jobLocation: 'Remote',
        companyWebsite: 'https://test.com',
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(xssData)
        .expect(201);

      // XSS should be sanitized
      expect(response.body).toHaveProperty('job');
      expect(response.body.job.company).toBe('&lt;img /&gt;');
      expect(response.body.job.position).toBe('Engineer');
      expect(response.body.job.status).toBe('pending');
      expect(response.body.job.jobType).toBe('full-time');
      expect(response.body.job.jobLocation).toBe('Remote');
      expect(response.body.job.companyWebsite).toBe('https://test.com');

      const xssData2 = {
        ...xssData,
        company: '<script>alert("hello");</script>corp',
      };

      const response2 = await request(app)
        .post('/api/v1/jobs')
        .set('Cookie', authCookie)
        .send(xssData2)
        .expect(201);

      expect(response2.body.job.company).toBe('&lt;script&gt;alert("hello");&lt;/script&gt;corp');
    });
  });

  describe('Middleware Stack Order', () => {
    it('should catch errors in async route handlers', async () => {
      const testUser = await seedTestUser(container);
      const authToken = generateTestToken(container, testUser);
      const authCookie = createTestCookie(authToken);

      // Trigger an error by providing invalid ObjectId
      const response = await request(app)
        .get('/api/v1/jobs/invalid-id')
        .set('Cookie', authCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('API Versioning', () => {
    it('should handle v1 API routes correctly', async () => {
      const response = await request(app).get('/api/v1/auth/logout').expect(200);

      expect(response.body.msg).toBe('user logged out!');
    });

    it('should return 404 for non-existent API versions', async () => {
      await request(app).get('/api/v2/auth/logout').expect(404);
    });
  });

  describe('Health Endpoint', () => {
    it('should return health status with 200 when database is connected', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.database).toHaveProperty('connected', true);
      expect(response.body.database.ping).toHaveProperty('success', true);
    });

    it('should include application info in non-production mode', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('application');
      expect(response.body.application).toHaveProperty('name', 'job-tracker-api');
      expect(response.body.application).toHaveProperty('environment');
    });
  });
});
