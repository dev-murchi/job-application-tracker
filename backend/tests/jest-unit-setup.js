// Unit tests don't need environment variables - they mock all external dependencies
// Set NODE_ENV to test to ensure proper test behavior
process.env.NODE_ENV = 'test';

// Mock the logger to prevent file writes during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock the config module to provide test defaults
// This prevents the need for actual environment variables in unit tests
jest.mock('../config', () => ({
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
}));

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
