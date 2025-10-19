const mongoose = require('mongoose');
const createConnectionManager = require('../../db/connect');
const dbService = require('../../db/db-service');
const { UserSchema, JobSchema } = require('../../models');
const config = require('../../config');
const { randomUUID } = require('crypto');

const createTestConnection = async (testSuite) => {
  // Create isolated mongoose connection instance
  const connection = mongoose.createConnection();

  // Create models using db-service
  dbService.createModel(connection, 'User', UserSchema);
  dbService.createModel(connection, 'Job', JobSchema);

  // Create connection manager
  const connectionManager = createConnectionManager({
    connection,
    config: { isProduction: false },
  });

  const workerId = process.env.JEST_WORKER_ID ?? '1';
  const testDbName = `test_db_${testSuite}_${workerId}_${randomUUID().replace(/-/g, '')}`;
  const dbUrl = process.env.MONGO_TEST_URL || config.mongoUrl;
  const index = dbUrl.lastIndexOf('/');
  const url = dbUrl.slice(0, index);
  const authSource = dbUrl.slice(index).split('?authSource=')[1] ?? 'admin';

  const testDbUrl = `${url}/${testDbName}?authSource=${authSource}`;

  // Connect to test database
  await connectionManager.connect(testDbUrl);

  return { connection, connectionManager };
};

const closeTestConnection = async (connection, connectionManager) => {
  await connection.dropDatabase();
  await connectionManager.closeConnection();
};

const clearDatabase = async (connection) => {
  const collections = connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

const seedTestUser = async (userData = {}) => {
  const User = dbService.getModel('User');

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

const seedTestJobs = async (userId, count = 5) => {
  const Job = dbService.getModel('Job');

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

const createTestJob = async (userId, jobData = {}) => {
  const Job = dbService.getModel('Job');

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

const deleteTestJob = async (jobId) => {
  const Job = dbService.getModel('Job');
  await Job.findByIdAndDelete(jobId);
}

const deleteTestUser = async (userId) => {
  const User = dbService.getModel('User');
  await User.findByIdAndDelete(userId);
}

const generateTestToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId: user._id }, config.jwtSecret, {
    expiresIn: config.jwtLifetime,
  });
};

const createTestCookie = (token) => {
  return `token=${token}`;
};

const getAllUsers = async () => {
  const User = dbService.getModel('User');
  return await User.find({}, '+password');
};

const getAllJobs = async (userId = null) => {
  const Job = dbService.getModel('Job');
  const query = userId ? { createdBy: userId } : {};
  return await Job.find(query);
};

const countDocuments = async (modelName) => {
  const Model = dbService.getModel(modelName);
  return await Model.countDocuments({});
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
