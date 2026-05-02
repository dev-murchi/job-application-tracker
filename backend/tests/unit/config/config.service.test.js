const { describe, beforeEach, it, expect } = require('@jest/globals');
const { createConfigService } = require('../../../adapters/infrastructure/config/config.service');

// Mock the validation utility
jest.mock('../../../adapters/infrastructure/config/validators/config-schema.validator', () => ({
  validateConfigWithSchema: jest.fn(),
}));

const {
  validateConfigWithSchema,
} = require('../../../adapters/infrastructure/config/validators/config-schema.validator');

describe('Config Service', () => {
  let configService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = createConfigService();
  });

  describe('Factory', () => {
    it('should create a service instance with required methods', () => {
      expect(configService).toHaveProperty('get');
      expect(configService).toHaveProperty('getAll');
      expect(configService).toHaveProperty('loadConfig');
    });
  });

  describe('loadConfig', () => {
    it('should validate and store configuration', () => {
      const mockSchema = { parse: jest.fn() };
      const mockRawConfig = { PORT: '3000' };
      const validatedConfig = { port: 3000 };

      validateConfigWithSchema.mockReturnValue(validatedConfig);

      configService.loadConfig(mockSchema, mockRawConfig);

      expect(validateConfigWithSchema).toHaveBeenCalledWith(mockSchema, mockRawConfig);
      expect(configService.get('port')).toBe(3000);
    });

    it('should warn when overwriting existing keys', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const mockSchema = {};

      // First load
      validateConfigWithSchema.mockReturnValue({ port: 3000 });
      configService.loadConfig(mockSchema, {});

      // Second load (overwrite)
      validateConfigWithSchema.mockReturnValue({ port: 4000 });
      configService.loadConfig(mockSchema, {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting existing config key "port"'),
      );
      expect(configService.get('port')).toBe(4000);

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent keys', () => {
      expect(configService.get('nonExistent')).toBeUndefined();
    });

    it('should retrieve stored values', () => {
      validateConfigWithSchema.mockReturnValue({ apiKey: 'abc-123' });
      configService.loadConfig({}, {});

      expect(configService.get('apiKey')).toBe('abc-123');
    });
  });

  describe('getAll', () => {
    it('should return all stored configuration as an object', () => {
      const config1 = { port: 3000 };
      const config2 = { dbUrl: 'mongodb://localhost' };

      validateConfigWithSchema.mockReturnValueOnce(config1).mockReturnValueOnce(config2);

      configService.loadConfig({}, {});
      configService.loadConfig({}, {});

      const allConfig = configService.getAll();

      expect(allConfig).toEqual({
        port: 3000,
        dbUrl: 'mongodb://localhost',
      });
    });

    it('should return a copy, not a reference to internal map', () => {
      validateConfigWithSchema.mockReturnValue({ port: 3000 });
      configService.loadConfig({}, {});

      const allConfig = configService.getAll();
      allConfig.port = 9999; // Modify returned object

      expect(configService.get('port')).toBe(3000); // Internal state should remain unchanged
    });
  });
});
