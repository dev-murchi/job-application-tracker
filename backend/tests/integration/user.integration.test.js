const request = require('supertest');
const {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  generateTestToken,
  createTestCookie,
  getAllUsers,
  deleteTestUser,
} = require('./setup.integration');

describe('User Integration Tests', () => {
  let container;
  let app;

  let testUser;
  let authToken;
  let authCookie;

  let authTokenForDeletedUser;
  let authCookieForDeletedUser;

  beforeAll(async () => {
    // Create isolated mongoose connection
    container = await createTestConnection('userIntegration');

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
    testUser = await seedTestUser(container, {
      name: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      location: 'Test City',
    });

    const deletedUser = await seedTestUser(container, {
      name: 'Deleted',
      lastName: 'User',
      email: 'deleted@example.com',
      password: 'password123',
      location: 'Test City',
    });

    // delete user
    await deleteTestUser(container, deletedUser._id);

    authToken = generateTestToken(container, testUser);
    authCookie = createTestCookie(authToken);

    authTokenForDeletedUser = generateTestToken(container, deletedUser);
    authCookieForDeletedUser = createTestCookie(authTokenForDeletedUser);
  });

  describe('GET /api/v1/users/profile', () => {
    it('should get current user profile with valid authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toEqual({
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        location: 'Test City',
      });
    });

    it('should reject profile request without authentication', async () => {
      const response = await request(app).get('/api/v1/users/profile').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication Invalid');

      const response2 = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', authCookieForDeletedUser)
        .expect(401);

      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('Authentication Invalid');
    });

    it('should reject profile request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', 'token=invalid-token-string')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject profile request with expired token', async () => {
      const jwt = require('jsonwebtoken');
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        container.configService.get('jwtSecret'),
        { expiresIn: '-1h' }, // Expired 1 hour ago
      );

      const expiredCookie = createTestCookie(expiredToken);

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', expiredCookie)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/update', () => {
    it('should update user name', async () => {
      const updateData = {
        name: 'Updated',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated');
      expect(response.body.lastName).toBe('User'); // Unchanged
      expect(response.body.email).toBe('test@example.com'); // Unchanged

      // Verify in database
      const users = await getAllUsers(container);
      const updatedUser = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(updatedUser.name).toBe('Updated');
    });

    it('should update user lastName', async () => {
      const updateData = {
        lastName: 'NewLastName',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.lastName).toBe('NewLastName');
      expect(response.body.name).toBe('Test'); // Unchanged
    });

    it('should update user email', async () => {
      const updateData = {
        email: 'newemail@example.com',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe('newemail@example.com');
      expect(response.body.name).toBe('Test'); // Unchanged

      // Verify in database
      const users = await getAllUsers(container);
      const updatedUser = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(updatedUser.email).toBe('newemail@example.com');
    });

    it('should update user location', async () => {
      const updateData = {
        location: 'New York',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.location).toBe('New York');
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        location: 'San Francisco',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        location: 'San Francisco',
      });

      // Verify in database
      const users = await getAllUsers(container);
      const updatedUser = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(updatedUser.name).toBe('John');
      expect(updatedUser.lastName).toBe('Doe');
      expect(updatedUser.email).toBe('john.doe@example.com');
      expect(updatedUser.location).toBe('San Francisco');
    });

    it('should trim whitespace from updated fields', async () => {
      const updateData = {
        name: '  Trimmed  ',
        lastName: '  Name  ',
        location: '  City  ',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Trimmed');
      expect(response.body.lastName).toBe('Name');
      expect(response.body.location).toBe('City');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        name: 'Unauthorized',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication Invalid');

      // Verify user was not updated
      const users = await getAllUsers(container);
      const user = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(user.name).toBe('Test');
    });

    it('should reject update with empty request body', async () => {
      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No changes provided');
    });

    it('should reject update with malformed JSON in update request', async () => {
      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email-format',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');

      // Verify user was not updated
      const users = await getAllUsers(container);
      const user = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(user.email).toBe('test@example.com');
    });

    it('should reject update with name shorter than 3 characters', async () => {
      const updateData = {
        name: 'Jo',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify user was not updated
      const users = await getAllUsers(container);
      const user = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(user.name).toBe('Test');
    });

    it('should reject update with empty lastName', async () => {
      const updateData = {
        lastName: '',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject update with duplicate email', async () => {
      // Create another user
      await seedTestUser(container, {
        name: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        location: 'City',
      });

      // Try to update testUser with other user's email
      const updateData = {
        email: 'other@example.com',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify user was not updated
      const users = await getAllUsers(container);
      const user = users.find((u) => u._id.toString() === testUser._id.toString());
      expect(user.email).toBe('test@example.com');
    });

    it('should not allow updating password through this endpoint', async () => {
      const updateData = {
        name: 'Test',
        password: 'newpassword123',
      };

      const response = await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', authCookie)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Unrecognized key');
      expect(response.body.message).toContain('password');
    });

    it('should handle concurrent updates correctly', async () => {
      const updateData1 = { name: 'First' };
      const updateData2 = { lastName: 'Second' };

      // Make concurrent requests
      const [response1, response2] = await Promise.all([
        request(app).patch('/api/v1/users/update').set('Cookie', authCookie).send(updateData1),
        request(app).patch('/api/v1/users/update').set('Cookie', authCookie).send(updateData2),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify final state
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', authCookie)
        .expect(200);

      // At least one update should be reflected
      expect(
        profileResponse.body.name === 'First' || profileResponse.body.lastName === 'Second',
      ).toBe(true);
    });
  });

  describe('User Integration - Complete Flow', () => {
    it('should complete register -> get profile -> update -> get profile flow', async () => {
      // Step 1: Register new user
      const registerData = {
        name: 'Flow',
        lastName: 'Test',
        email: 'flow@example.com',
        password: 'password123',
        location: 'Initial City',
      };

      await request(app).post('/api/v1/auth/register').send(registerData).expect(201);

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'flow@example.com',
          password: 'password123',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));

      // Step 3: Get profile
      const profileResponse1 = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', tokenCookie)
        .expect(200);

      expect(profileResponse1.body).toEqual({
        name: 'Flow',
        lastName: 'Test',
        email: 'flow@example.com',
        location: 'Initial City',
      });

      // Step 4: Update profile
      const updateData = {
        name: 'Updated Flow',
        location: 'Updated City',
      };

      await request(app)
        .patch('/api/v1/users/update')
        .set('Cookie', tokenCookie)
        .send(updateData)
        .expect(200);

      // Step 5: Get profile again and verify changes
      const profileResponse2 = await request(app)
        .get('/api/v1/users/profile')
        .set('Cookie', tokenCookie)
        .expect(200);

      expect(profileResponse2.body).toEqual({
        name: 'Updated Flow',
        lastName: 'Test',
        email: 'flow@example.com',
        location: 'Updated City',
      });
    });
  });
});
