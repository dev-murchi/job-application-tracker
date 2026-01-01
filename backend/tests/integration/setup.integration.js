const { createContainer } = require('../../container');
const config = require('../../config');
const { randomUUID } = require('crypto');

/**
 * Create a silent logger for integration tests
 * Suppresses all log output during test execution
 * @returns {Object} Mock logger with no-op methods
 */
const createTestLogger = () => ({
  error: () => {},
  warn: () => {},
  info: () => {},
  http: () => {},
  debug: () => {},
  stream: { write: () => {} },
});

const createTestConnection = async (testSuite) => {
  const workerId = process.env.JEST_WORKER_ID ?? '1';
  const testDbName = `test_db_${testSuite}_${workerId}_${randomUUID().replace(/-/g, '')}`;
  const dbUrl = process.env.MONGO_TEST_URL || config.mongoUrl;
  const index = dbUrl.lastIndexOf('/');
  const url = dbUrl.slice(0, index);
  const authSource = dbUrl.slice(index).split('?authSource=')[1] ?? 'admin';

  const testDbUrl = `${url}/${testDbName}?authSource=${authSource}`;

  // Create a test logger for the container
  const logger = createTestLogger();

  // Create container with isolated test database
  const container = await createContainer({ mongoUrl: testDbUrl, isProduction: false, logger });

  return container;
};

const closeTestConnection = async (container) => {
  await container.connection.dropDatabase();
  await container.dispose();
};

const clearDatabase = async (container) => {
  const collections = Object.values(container.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const seedTestUser = async (container, userData = {}) => {
  const User = container.dbService.getModel('User');

  const defaultUserData = {
    name: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    password: 'password123',
    location: 'Test City',
    ...userData,
  };

  const user = await User.create(defaultUserData);
  return user;
};

const seedTestJobs = async (container, userId, count = 5) => {
  const Job = container.dbService.getModel('Job');

  const jobs = Array.from({ length: count }, (_, i) => ({
    company: `Test Company ${i + 1}`,
    position: `Test Position ${i + 1}`,
    status: ['pending', 'interview', 'declined'][i % 3],
    jobType: ['full-time', 'part-time', 'internship'][i % 3],
    jobLocation: `Test Location ${i + 1}`,
    companyWebsite: `https://testcompany${i + 1}.com`,
    createdBy: userId,
  }));

  const createdJobs = await Job.insertMany(jobs);
  return createdJobs;
};

const createTestJob = async (container, userId, jobData = {}) => {
  const Job = container.dbService.getModel('Job');

  const defaultJobData = {
    company: 'Test Company',
    position: 'Test Position',
    status: 'pending',
    jobType: 'full-time',
    jobLocation: 'Remote',
    companyWebsite: 'https://testcompany.com',
    createdBy: userId,
    ...jobData,
  };

  const job = await Job.create(defaultJobData);
  return job;
};

const deleteTestJob = async (container, jobId) => {
  const Job = container.dbService.getModel('Job');
  await Job.findByIdAndDelete(jobId);
};

const deleteTestUser = async (container, userId) => {
  const User = container.dbService.getModel('User');
  await User.findByIdAndDelete(userId);
};

const generateTestToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId: user._id }, config.jwtSecret, {
    expiresIn: config.jwtLifetime,
  });
};

const createTestCookie = (token) => {
  return `token=${token}`;
};

const getAllUsers = async (container) => {
  const User = container.dbService.getModel('User');
  return await User.find({}, '+password');
};

const getAllJobs = async (container, userId = null) => {
  const Job = container.dbService.getModel('Job');
  const query = userId ? { createdBy: userId } : {};
  return await Job.find(query);
};

const countDocuments = async (container, modelName) => {
  const Model = container.dbService.getModel(modelName);
  return await Model.countDocuments({});
};

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

module.exports = {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  seedTestJobs,
  createTestJob,
  deleteTestJob,
  deleteTestUser,
  generateTestToken,
  createTestCookie,
  getAllUsers,
  getAllJobs,
  countDocuments,
  wait,
};
