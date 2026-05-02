const { createContainerRegistry } = require('../../ioc/registry');
const {
  createEnvironmentConfigSource,
  createConfigService,
} = require('../../adapters/infrastructure/config');
const { randomUUID } = require('crypto');
const { ConfigSchema } = require('../../shared/schemas');
const {
  USER_REPOSITORY_PORT,
  JOB_REPOSITORY_PORT,
  TOKEN_SERVICE_PORT,
  AUTH_SERVICE_PORT,
  JOB_SERVICE_PORT,
  USER_SERVICE_PORT,
  CRYPTO_SERVICE_PORT,
  DB_CONNECTION_MANAGER_PORT,
  EXPRESS_APP,
  CONFIG_SERVICE_PORT,
} = require('../../ioc/di-tokens');

const rawConfig = createEnvironmentConfigSource().read();

/**
 * Create a silent logger service for integration tests
 * Suppresses all log output during test execution
 * @returns {Object} Mock logger service with no-op methods
 */
const createTestLoggerService = () => ({
  error: () => {},
  warn: () => {},
  info: () => {},
  http: () => {},
  debug: () => {},
  stream: { write: () => {} },
});

const MONGO_TEST_URL_ENV = 'MONGO_TEST_URL';
const MONGO_URL_ENV = 'MONGO_URL';
const DEFAULT_AUTH_SOURCE = 'admin';

const resolveMongoBaseUrl = () => {
  const dbUrl = process.env[MONGO_TEST_URL_ENV] || rawConfig.mongoUrl;

  if (typeof dbUrl !== 'string' || dbUrl.trim().length === 0) {
    throw new Error(
      `Missing MongoDB URL for integration tests. Set '${MONGO_TEST_URL_ENV}' (preferred) or '${MONGO_URL_ENV}' in the test environment.`,
    );
  }

  return dbUrl.trim();
};

const buildIsolatedTestDbUrl = (baseUrl, testDbName) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(baseUrl);
  } catch (error) {
    throw new Error(
      `Invalid MongoDB URL '${baseUrl}' for integration tests. Provide a valid '${MONGO_TEST_URL_ENV}' or '${MONGO_URL_ENV}'.`,
      { cause: error },
    );
  }

  if (parsedUrl.protocol !== 'mongodb:' && parsedUrl.protocol !== 'mongodb+srv:') {
    throw new Error(
      `Unsupported MongoDB protocol '${parsedUrl.protocol}'. Expected 'mongodb:' or 'mongodb+srv:'.`,
    );
  }

  parsedUrl.pathname = `/${testDbName}`;

  if (!parsedUrl.searchParams.has('authSource')) {
    parsedUrl.searchParams.set('authSource', DEFAULT_AUTH_SOURCE);
  }

  return parsedUrl.toString();
};

const createTestConnection = async (testSuite) => {
  const workerId = process.env.JEST_WORKER_ID ?? '1';
  const testDbName = `test_db_${testSuite}_${workerId}_${randomUUID().replace(/-/g, '')}`;
  const baseDbUrl = resolveMongoBaseUrl();
  const testDbUrl = buildIsolatedTestDbUrl(baseDbUrl, testDbName);

  try {
    // Create a test logger service for the container
    const loggerService = createTestLoggerService();

    const configService = createConfigService();

    const mergedConfig = { ...rawConfig, mongoUrl: testDbUrl };
    configService.loadConfig(ConfigSchema, mergedConfig);

    // Create container with isolated test database
    const container = await createContainerRegistry({ configService, loggerService });

    // Connect to database
    const dbConnectionManager = container.resolve(DB_CONNECTION_MANAGER_PORT);
    await dbConnectionManager.connect(testDbUrl);

    const connection = dbConnectionManager.getDriverInstance();
    // Return a wrapper object with direct access to commonly used dependencies
    return {
      // Container methods
      resolve: (name) => container.resolve(name),
      dispose: () => container.dispose(),

      // Direct access to commonly used dependencies for convenience
      connection: connection,
      dbConnectionManager: dbConnectionManager,
      userRepository: container.resolve(USER_REPOSITORY_PORT),
      jobRepository: container.resolve(JOB_REPOSITORY_PORT),
      app: container.resolve(EXPRESS_APP),
      jwtService: container.resolve(TOKEN_SERVICE_PORT),
      authService: container.resolve(AUTH_SERVICE_PORT),
      jobService: container.resolve(JOB_SERVICE_PORT),
      userService: container.resolve(USER_SERVICE_PORT),
      configService: container.resolve(CONFIG_SERVICE_PORT),
    };
  } catch (error) {
    throw new Error(`Failed to initialize integration test connection for suite '${testSuite}'.`, {
      cause: error,
    });
  }
};

const closeTestConnection = async (container) => {
  if (!container) {
    return;
  }

  if (container.connection && typeof container.connection.dropDatabase === 'function') {
    await container.connection.dropDatabase();
  }

  if (typeof container.dispose === 'function') {
    await container.dispose();
  }
};

const clearDatabase = async (container) => {
  const collections = Object.values(container.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const seedTestUser = async (container, userData = {}) => {
  const userRepository = container.resolve(USER_REPOSITORY_PORT);
  const cryptoService = container.resolve(CRYPTO_SERVICE_PORT);

  const defaultUserData = {
    name: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    password: 'password123',
    location: 'Test City',
    ...userData,
  };

  defaultUserData.password = await cryptoService.hash(defaultUserData.password);

  const user = await userRepository.create(defaultUserData);
  return user;
};

const seedTestJobs = async (container, userId, count = 5) => {
  const jobRepository = container.resolve(JOB_REPOSITORY_PORT);

  const jobs = Array.from({ length: count }, (_, i) => ({
    company: `Test Company ${i + 1}`,
    position: `Test Position ${i + 1}`,
    status: ['pending', 'interview', 'declined'][i % 3],
    jobType: ['full-time', 'part-time', 'internship'][i % 3],
    jobLocation: `Test Location ${i + 1}`,
    companyWebsite: `https://testcompany${i + 1}.com`,
    createdBy: userId,
  }));

  const createdJobs = await Promise.all(jobs.map((j) => jobRepository.create(j)));
  return createdJobs;
};

const createTestJob = async (container, userId, jobData = {}) => {
  const jobRepository = container.resolve(JOB_REPOSITORY_PORT);

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

  const job = await jobRepository.create(defaultJobData);
  return job;
};

const deleteTestJob = async (container, jobId) => {
  const jobRepository = container.resolve(JOB_REPOSITORY_PORT);
  await jobRepository.deleteById(jobId);
};

const deleteTestUser = async (container, userId) => {
  const userRepository = container.resolve(USER_REPOSITORY_PORT);
  await userRepository.deleteById(userId);
};

const generateTestToken = (container, user) => {
  return container.jwtService.sign({ userId: user._id });
};

const createTestCookie = (token) => {
  return `token=${token}`;
};

const getAllUsers = async (container) => {
  const userRepository = container.resolve(USER_REPOSITORY_PORT);
  return await userRepository.findAllWithPassword();
};

const getUserCount = async (container) => {
  const userRepository = container.resolve(USER_REPOSITORY_PORT);
  return await userRepository.count({});
};

const getAllJobs = async (container, userId = null) => {
  const jobRepository = container.resolve(JOB_REPOSITORY_PORT);
  const query = userId ? { createdBy: userId } : {};
  return await jobRepository.find(query);
};

const getJobCount = async (container) => {
  const jobRepository = container.resolve(JOB_REPOSITORY_PORT);
  return await jobRepository.count({});
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
  getJobCount,
  getUserCount,
  wait,
};
