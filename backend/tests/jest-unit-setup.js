// Unit tests don't need environment variables - they mock all external dependencies
// Set NODE_ENV to test to ensure proper test behavior
process.env.NODE_ENV = 'test';

// Mock the logger to prevent file writes during tests
jest.mock('../adapters/infrastructure/logger/winston/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock infrastructure config adapters to avoid env/dependency coupling in unit tests
jest.mock('../adapters/infrastructure/config', () => {
  const defaults = {
    nodeEnv: 'test',
    port: 3000,
    mongoUrl: 'mongodb://localhost:27017/test',
    jwtSecret: 'test-jwt-secret-minimum-32-characters-long-for-security',
    jwtLifetime: '7d',
    corsOrigin: '*',
    rateLimitWindowMs: 900000,
    rateLimitMaxRequests: 100,
    logLevel: 'error',
    requestSizeLimit: '100kb',
    isProduction: false,
    isDevelopment: false,
    isTest: true,
  };

  return {
    createEnvironmentConfigSource: () => ({
      read: () => ({ ...defaults }),
    }),
    createConfigService: () => ({
      get: (key) => defaults[key],
      getAll: () => ({ ...defaults }),
      loadConfig: jest.fn(),
    }),
  };
});

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
