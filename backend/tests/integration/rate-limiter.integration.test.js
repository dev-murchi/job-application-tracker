// ser node_env as prodcution
process.env.NODE_ENV = 'production';

const request = require('supertest');
const {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  wait,
} = require('./setup.integration');

describe('Rate Limiter Integration Tests', () => {
  let container;
  let app;

  beforeAll(async () => {
    // Create isolated mongoose connection
    container = await createTestConnection('rateLimitIntegration');

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

    // Create test user and auth token for authenticated requests
    await seedTestUser(container, {
      name: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      location: 'Test City',
    });

    // Wait between tests to avoid rate limit carryover
    await wait(100);
  });

  describe('Rate Limit Headers', () => {
    it('should include standard rate limit headers in response  (not legacy X- headers)', async () => {
      const response = await request(app).get('/').expect(200);

      // Standard rate limit headers (RateLimit-* headers)
      expect(response.header['ratelimit-limit']).toBeDefined();
      expect(response.header['ratelimit-remaining']).toBeDefined();
      expect(response.header['ratelimit-policy']).toBeDefined();
      expect(response.header['ratelimit-reset']).toBeDefined();
      expect(response.header['x-ratelimit-limit']).toBeUndefined();
    });
  });

  describe('Auth Route Rate Limiting', () => {
    it('should allow requests within rate limit and block exceeding requests', async () => {
      // Auth routes have a limit of 5 requests
      const requestCount = 5;
      const requests = Array(requestCount)
        .fill(null)
        .map(() =>
          request(app).post('/api/v1/auth/login').send({
            email: 'test@example.com',
            password: 'wrongpassword',
          }),
        );

      const responses = await Promise.allSettled(requests);
      let remainingRequestCount = requestCount;
      for (const resp of responses) {
        remainingRequestCount = remainingRequestCount - 1;
        expect(resp.value.statusCode).toBe(401);
        expect(resp.value.body).toBeDefined();
        expect(resp.value.body.message).toBe('Invalid Credentials');
        expect(resp.value.header['ratelimit-remaining']).toBe(`${remainingRequestCount}`);
      }

      const rateLimitedResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(429);

      expect(rateLimitedResponse.text).toBe(
        'Too many login/register attempts, please try again after 15 minutes',
      );
      expect(rateLimitedResponse.header['ratelimit-limit']).toBe('5');
      expect(rateLimitedResponse.header['ratelimit-remaining']).toBe('0');
      expect(rateLimitedResponse.header['ratelimit-reset']).toBe('900'); // 15min in seconds
    });

    it('should apply rate limit to all auth routes', async () => {
      // Mix login and register requests
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' }),
        );
        requests.push(
          request(app)
            .post('/api/v1/auth/register')
            .send({
              name: `User${i}`,
              lastName: 'Test',
              email: `user${i}@example.com`,
              password: 'password123',
              location: 'City',
            }),
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });
});
