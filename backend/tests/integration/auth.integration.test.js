const request = require('supertest');
const {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  getAllUsers,
  countDocuments,
} = require('./setup.integration');

describe('Auth Integration Tests', () => {
  let app;
  let connectionManager;
  let connection;

  beforeAll(async () => {
    // Create isolated mongoose connection
    const testConnection = await createTestConnection('authIntegration');
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
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        location: 'New York',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(201);

      expect(response.body).toEqual({
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        location: 'New York',
      });

      // Verify user is in database
      const userCount = await countDocuments('User');
      expect(userCount).toBe(1);

      const users = await getAllUsers();
      expect(users[0].email).toBe('john.doe@example.com');
      expect(users[0].password).not.toBe('password123'); // Password should be hashed
    });

    it('should return consistent error structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test' }) // Missing required fields
        .expect(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        name: 'Test',
        lastName: 'User',
        email: 'duplicate@example.com',
        password: 'password123',
        location: 'City',
      };

      // First registration should succeed
      await request(app).post('/api/v1/auth/register').send(userData).expect(201);

      // Second registration with same email should fail
      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already in use');

      // Verify only one user was created
      const userCount = await countDocuments('User');
      expect(userCount).toBe(1);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests exceeding size limit', async () => {
      // Create a large payload (assuming default limit is 1MB)
      const largeData = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        location: 'City',
        largeField: 'x'.repeat(2 * 1024 * 1024), // 2MB of data
      };

      await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(largeData)
        .expect(413);
    });

    it('should parse application/json-patch+json content type', async () => {
      const userData = {
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        location: 'City',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json-patch+json')
        .send(userData)
        .expect(201);

      expect(response.body.email).toBe('test@example.com');
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send('name=Test')
        .expect(400);

      // Should fail validation or parsing
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing name', async () => {
      const userData = {
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        location: 'City',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Name is required');

      const userCount = await countDocuments('User');
      expect(userCount).toBe(0);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
        location: 'City',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');

      const userCount = await countDocuments('User');
      expect(userCount).toBe(0);
    });

    it('should reject registration with empty password', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '',
        location: 'City',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');

      const userCount = await countDocuments('User');
      expect(userCount).toBe(0);
    });

    it('should reject registration with name shorter than 3 characters', async () => {
      const userData = {
        name: 'Jo',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        location: 'City',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(400);

      expect(response.body.success).toBe(false);

      const userCount = await countDocuments('User');
      expect(userCount).toBe(0);
    });

    it('should trim leading and trailing whitespaces from string fields', async () => {
      const userData = {
        name: '  John  ',
        lastName: '  Doe  ',
        email: 'john@example.com',
        password: 'password123',
        location: '  City  ',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(201);

      expect(response.body.name).toBe('John');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body.email).toBe('john@example.com');
      expect(response.body.location).toBe('City');
    });

    it('should reject registration if email has leading or trailing whitespaces', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: '  john@example.com  ',
        password: 'password123',
        location: 'City',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData).expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Seed a test user before each login test
      await seedTestUser({
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        location: 'Test City',
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(200);

      expect(response.body).toEqual({
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        location: 'Test City',
      });
    });

    it('should set JWT token in httpOnly cookie on successful login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Credentials');

      // Should not set cookie on failed login
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Credentials');
    });

    it('should reject login with missing email', async () => {
      const loginData = {
        password: 'password123',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing password', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle case-sensitive email login', async () => {
      const loginData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      const response = await request(app).post('/api/v1/auth/login').send(loginData).expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Credentials');
    });
  });

  describe('GET /api/v1/auth/logout', () => {
    it('should logout user and clear token cookie', async () => {
      const response = await request(app).get('/api/v1/auth/logout').expect(200);

      expect(response.body).toEqual({ msg: 'user logged out!' });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const tokenCookie = cookies.find((cookie) => cookie.startsWith('token=logout'));
      expect(tokenCookie).toBeDefined();
    });

    it('should set cookie with past expiration date', async () => {
      const response = await request(app).get('/api/v1/auth/logout').expect(200);

      const cookies = response.headers['set-cookie'];
      const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));

      // Cookie should have an expiration date in the past
      expect(tokenCookie).toContain('Expires=');
    });

    it('should allow logout without being authenticated', async () => {
      // Logout should work even if user is not logged in
      const response = await request(app).get('/api/v1/auth/logout').expect(200);

      expect(response.body.msg).toBe('user logged out!');
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full registration -> login -> logout flow', async () => {
      // Step 1: Register
      const userData = {
        name: 'Flow',
        lastName: 'Test',
        email: 'flow@example.com',
        password: 'password123',
        location: 'City',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.email).toBe('flow@example.com');

      // Step 2: Login
      const loginData = {
        email: 'flow@example.com',
        password: 'password123',
      };

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.email).toBe('flow@example.com');

      const cookies = loginResponse.headers['set-cookie'];
      const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));
      expect(tokenCookie).toBeDefined();

      // Step 3: Logout
      const logoutResponse = await request(app).get('/api/v1/auth/logout').expect(200);

      expect(logoutResponse.body.msg).toBe('user logged out!');
    });
  });
});
