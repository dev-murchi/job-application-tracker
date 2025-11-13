const { describe, beforeEach, it, expect } = require('@jest/globals');
const { createHealthController } = require('../../controllers/health');
const { StatusCodes } = require('http-status-codes');

// Mock health service factory
const createMockHealthService = () => ({
  getHealthStatus: jest.fn(),
});

describe('Health Controller', () => {
  let mockReq, mockRes, mockHealthService, healthController;

  beforeEach(() => {
    mockHealthService = createMockHealthService();
    healthController = createHealthController(mockHealthService);

    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return 200 OK when system is healthy', async () => {
      const mockHealthStatus = {
        status: 'ok',
        timestamp: '2025-11-11T10:00:00.000Z',
        uptime: 1234,
        database: {
          status: 'connected',
          connected: true,
          ping: { success: true, responseTime: 5 },
        },
      };

      mockHealthService.getHealthStatus.mockResolvedValueOnce(mockHealthStatus);

      await healthController.getHealth(mockReq, mockRes);

      expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith(mockHealthStatus);
    });

    it('should return 503 SERVICE_UNAVAILABLE when system is degraded', async () => {
      const mockHealthStatus = {
        status: 'degraded',
        timestamp: '2025-11-11T10:00:00.000Z',
        uptime: 1234,
        database: {
          status: 'disconnected',
          connected: false,
          ping: { success: false, responseTime: null },
        },
      };

      mockHealthService.getHealthStatus.mockResolvedValueOnce(mockHealthStatus);

      await healthController.getHealth(mockReq, mockRes);

      expect(mockHealthService.getHealthStatus).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.SERVICE_UNAVAILABLE);
      expect(mockRes.json).toHaveBeenCalledWith(mockHealthStatus);
    });

    it('should propagate errors from health service', async () => {
      const error = new Error('Database connection failed');
      mockHealthService.getHealthStatus.mockRejectedValueOnce(error);

      await expect(healthController.getHealth(mockReq, mockRes)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
