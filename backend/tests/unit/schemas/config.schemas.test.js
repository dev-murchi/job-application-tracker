const { ConfigSchema } = require('../../../shared/schemas');

const VALID_JWT_SECRET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';

const buildValidConfig = (overrides = {}) => ({
  nodeEnv: 'test',
  port: 3000,
  mongoUrl: 'mongodb://localhost:27017/job-tracker-test',
  jwtSecret: VALID_JWT_SECRET,
  jwtLifetime: '7d',
  corsOrigin: 'https://app.example.com',
  trustProxyHops: 2,
  rateLimitWindowMs: 900000,
  rateLimitMaxRequests: 100,
  logLevel: 'info',
  requestSizeLimit: '100kb',
  ...overrides,
});

describe('ConfigSchema', () => {
  it('should validate a valid mongodb:// connection URL', () => {
    const cfg = ConfigSchema.parse(buildValidConfig());

    expect(cfg.mongoUrl).toBe('mongodb://localhost:27017/job-tracker-test');
  });

  it('should reject invalid mongo URL protocols', () => {
    expect(() =>
      ConfigSchema.parse(buildValidConfig({ mongoUrl: 'http://localhost:27017/db' })),
    ).toThrow('MongoDB URL must be a valid mongodb:// or mongodb+srv:// URI');
  });

  it('should reject malformed mongo URLs', () => {
    expect(() => ConfigSchema.parse(buildValidConfig({ mongoUrl: 'not-a-uri' }))).toThrow(
      'MongoDB URL must be a valid mongodb:// or mongodb+srv:// URI',
    );
  });

  it('should parse comma-separated CORS origins into an array', () => {
    const cfg = ConfigSchema.parse(
      buildValidConfig({
        corsOrigin: 'https://app.example.com, https://admin.example.com',
      }),
    );

    expect(Array.isArray(cfg.corsOrigin)).toBe(true);
    expect(cfg.corsOrigin).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('should keep wildcard CORS origin as a string', () => {
    const cfg = ConfigSchema.parse(buildValidConfig({ corsOrigin: '*' }));

    expect(cfg.corsOrigin).toBe('*');
  });

  it('should reject invalid CORS origin values', () => {
    expect(() =>
      ConfigSchema.parse(
        buildValidConfig({ corsOrigin: 'https://app.example.com,ftp://bad-origin' }),
      ),
    ).toThrow("CORS origin must be '*' or a comma-separated list of valid http(s) origins");
  });

  it('should allow production config without health token after health endpoint rollback', () => {
    const cfg = ConfigSchema.parse(buildValidConfig({ nodeEnv: 'production' }));

    expect(cfg.isProduction).toBe(true);
  });
});
