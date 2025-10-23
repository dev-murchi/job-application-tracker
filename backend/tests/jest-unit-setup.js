const path = require('path');

// Load test environment variables first
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env.test'),
  quiet: true,
});

// Set NODE_ENV before importing any modules
process.env.NODE_ENV = 'test';

// Mock the logger to prevent file writes during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
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
