const { describe, beforeEach, it, expect } = require('@jest/globals');
const { createHealthService } = require('../../services/health.service');

// Mock config
jest.mock('../../config', () => ({
  isProduction: false,
  nodeEnv: 'test',
}));

// Mock dbConnectionManager factory
const createMockDbConnectionManager = () => ({
  getConnectionStatus: jest.fn(),
  isConnected: jest.fn(),
  healthPing: jest.fn(),
});

describe('Health Service', () => {
  let mockDbConnectionManager, healthService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnectionManager = createMockDbConnectionManager();
    healthService = createHealthService(mockDbConnectionManager);
  });

  describe('getHealthStatus', () => {
    it('should return ok status when database is healthy', async () => {
      const mockDbStatus = {
        state: 'connected',
        host: 'localhost',
        port: 27017,
        name: 'test_db',
        readyState: 1,
      };

      const mockDbPing = {
        success: true,
        responseTime: 10,
      };

      mockDbConnectionManager.getConnectionStatus.mockReturnValue(mockDbStatus);
      mockDbConnectionManager.isConnected.mockReturnValue(true);
      mockDbConnectionManager.healthPing.mockResolvedValue(mockDbPing);

      const result = await healthService.getHealthStatus();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('connected');
      expect(result.database.connected).toBe(true);
      expect(result.database.ping.success).toBe(true);
      expect(result.database.ping.responseTime).toBe(10);
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return degraded status when database is disconnected', async () => {
      const mockDbStatus = {
        state: 'disconnected',
        host: 'localhost',
        port: 27017,
        name: 'test_db',
        readyState: 0,
      };

      const mockDbPing = {
        success: false,
        responseTime: null,
      };

      mockDbConnectionManager.getConnectionStatus.mockReturnValue(mockDbStatus);
      mockDbConnectionManager.isConnected.mockReturnValue(false);
      mockDbConnectionManager.healthPing.mockResolvedValue(mockDbPing);

      const result = await healthService.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.database.connected).toBe(false);
      expect(result.database.ping.success).toBe(false);
    });

    it('should return degraded status when ping fails', async () => {
      const mockDbStatus = {
        state: 'connected',
        host: 'localhost',
        port: 27017,
        name: 'test_db',
        readyState: 1,
      };

      const mockDbPing = {
        success: false,
        error: 'Timeout',
      };

      mockDbConnectionManager.getConnectionStatus.mockReturnValue(mockDbStatus);
      mockDbConnectionManager.isConnected.mockReturnValue(true);
      mockDbConnectionManager.healthPing.mockResolvedValue(mockDbPing);

      const result = await healthService.getHealthStatus();

      expect(result.status).toBe('degraded');
    });

    it('should handle errors gracefully and return degraded status', async () => {
      mockDbConnectionManager.getConnectionStatus.mockImplementation(() => {
        throw new Error('Connection manager error');
      });

      const result = await healthService.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('error');
      expect(result.database.ping.success).toBe(false);
    });

    it('should include application info in non-production mode', async () => {
      const mockDbStatus = {
        state: 'connected',
        host: 'localhost',
        port: 27017,
        name: 'test_db',
        readyState: 1,
      };

      mockDbConnectionManager.getConnectionStatus.mockReturnValue(mockDbStatus);
      mockDbConnectionManager.isConnected.mockReturnValue(true);
      mockDbConnectionManager.healthPing.mockResolvedValue({ success: true, responseTime: 5 });

      const result = await healthService.getHealthStatus();

      expect(result.application).toBeDefined();
      expect(result.application.name).toBe('job-tracker-api');
      expect(result.application.nodeVersion).toBeDefined();
      expect(result.application.environment).toBe('test');
      expect(result.application.pid).toBeDefined();
    });

    it('should include database connection details in non-production mode', async () => {
      const mockDbStatus = {
        state: 'connected',
        host: 'localhost',
        port: 27017,
        name: 'test_db',
        readyState: 1,
      };

      mockDbConnectionManager.getConnectionStatus.mockReturnValue(mockDbStatus);
      mockDbConnectionManager.isConnected.mockReturnValue(true);
      mockDbConnectionManager.healthPing.mockResolvedValue({ success: true, responseTime: 5 });

      const result = await healthService.getHealthStatus();

      expect(result.database.host).toBe('localhost');
      expect(result.database.port).toBe(27017);
      expect(result.database.name).toBe('test_db');
      expect(result.database.readyState).toBe(1);
    });

    it('should hide sensitive details in production mode', async () => {
      // Temporarily set production mode
      const config = require('../../config');
      config.isProduction = true;

      const mockDbStatus = {
        state: 'connected',
        host: 'prod-db.example.com',
        port: 27017,
        name: 'production_db',
        readyState: 1,
      };

      mockDbConnectionManager.getConnectionStatus.mockReturnValue(mockDbStatus);
      mockDbConnectionManager.isConnected.mockReturnValue(true);
      mockDbConnectionManager.healthPing.mockResolvedValue({ success: true, responseTime: 5 });

      const result = await healthService.getHealthStatus();

      expect(result.application).toBeUndefined();
      expect(result.database.host).toBeUndefined();
      expect(result.database.port).toBeUndefined();
      expect(result.database.name).toBeUndefined();
      expect(result.database.readyState).toBeUndefined();

      // Reset
      config.isProduction = false;
    });
  });
});
