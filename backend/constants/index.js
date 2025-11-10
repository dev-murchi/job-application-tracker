/**
 * Global Constants
 * Centralized location for all application-wide constants
 */

// ==================== Time Constants ====================
const ONE_SECOND_MS = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

const ONE_MINUTE_MS = SECONDS_IN_MINUTE * ONE_SECOND_MS;
const ONE_HOUR_MS = MINUTES_IN_HOUR * ONE_MINUTE_MS;
const ONE_DAY_MS = HOURS_IN_DAY * ONE_HOUR_MS;

// ==================== Server Constants ====================
const KEEP_ALIVE_TIMEOUT_SECONDS = 61;
const HEADERS_TIMEOUT_SECONDS = 65;
const GRACEFUL_SHUTDOWN_TIMEOUT_SECONDS = 30;

const KEEP_ALIVE_TIMEOUT_MS = KEEP_ALIVE_TIMEOUT_SECONDS * ONE_SECOND_MS;
const HEADERS_TIMEOUT_MS = HEADERS_TIMEOUT_SECONDS * ONE_SECOND_MS;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = GRACEFUL_SHUTDOWN_TIMEOUT_SECONDS * ONE_SECOND_MS;

// ==================== Database Connection Constants ====================
const POOL_MAX_PROD = 50;
const POOL_MAX_DEV = 10;
const POOL_MIN_PROD = 5;
const POOL_MIN_DEV = 2;

const MAX_IDLE_TIME_MS = 30_000;
const WAIT_QUEUE_TIMEOUT_MS = 5_000;

const SERVER_SELECTION_TIMEOUT_MS = 5_000;
const SOCKET_TIMEOUT_MS = 45_000;
const CONNECT_TIMEOUT_MS = 10_000;

const HEARTBEAT_FREQUENCY_MS = 10_000;

const WRITE_CONCERN_W = 'majority';
const WRITE_CONCERN_J = true;
const WRITE_CONCERN_WTIMEOUT_MS = 5_000;

const READ_CONCERN_LEVEL = 'majority';
const READ_PREFERENCE = 'secondaryPreferred';

const COMPRESSORS = ['zlib'];
const ZLIB_COMPRESSION_LEVEL = 6;

const MONITOR_COMMANDS_IN_DEV = true;

// Database ready states
const READY_STATE_DISCONNECTED = 0;
const READY_STATE_CONNECTED = 1;
const READY_STATE_CONNECTING = 2;
const READY_STATE_DISCONNECTING = 3;
const READY_STATE_UNINITIALIZED = 99;

// ==================== MongoDB Error Codes ====================
const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

// ==================== JWT Constants ====================
const JWT_SECRET_MIN_LENGTH = 32; // 256 bits
const JWT_SECRET_MIN_ENTROPY = 4.5;
const JWT_LIFETIME_MAX_DAYS = 30;
const JWT_LIFETIME_MAX_HOURS = 720; // 30 days * 24
const JWT_LIFETIME_MAX_MINUTES = 43200; // 30 days * 24 * 60
const JWT_LIFETIME_MAX_SECONDS = 2592000; // 30 days * 24 * 60 * 60
const DEFAULT_JWT_LIFETIME = '7d';

const JWT_LIFETIME_REGEX = /^\d+[dhms]$/;
const JWT_LIFETIME_REGEX_ERROR = 'JWT lifetime must be in format: 30d, 24h, 60m, 3600s';

// ==================== Rate Limiting Constants ====================
const DEFAULT_RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

// ==================== Application Constants ====================
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_REQUEST_SIZE_LIMIT = '100kb';
const DEFAULT_CORS_ORIGIN = '*';
const PORT_MIN = 1;
const PORT_MAX = 65535;

const REQUEST_SIZE_LIMIT_REGEX = /^\d+[kmgtpezy]?b?$/i;
const REQUEST_SIZE_LIMIT_REGEX_ERROR =
  'Invalid size format. Use formats like "10mb", "500kb", "1gb"';

// ==================== User Validation Constants ====================
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MIN_LENGTH_MODEL = 6; // For User model (legacy)
const LASTNAME_MAX_LENGTH = 20;
const LOCATION_MAX_LENGTH = 20;

// ==================== Security Constants ====================
const BCRYPT_SALT_ROUNDS = 10;

// ==================== Pagination Constants ====================
const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 100;

// ==================== Job Constants ====================
const JOB_STATUS_ENUM = ['interview', 'declined', 'pending', 'offered', 'accepted'];
const JOB_TYPE_ENUM = ['full-time', 'part-time', 'internship'];
const SORT_ORDER_ENUM = ['a-z', 'z-a', 'newest', 'oldest'];
const MONTHLY_STATS_LOOKBACK_MONTHS = 6;

// ==================== Mongoose ObjectId Constants ====================
const MONGOOSE_OBJECT_ID_LENGTH = 24;

module.exports = {
  // Time
  ONE_SECOND_MS,
  SECONDS_IN_MINUTE,
  MINUTES_IN_HOUR,
  HOURS_IN_DAY,
  ONE_MINUTE_MS,
  ONE_HOUR_MS,
  ONE_DAY_MS,

  // Server
  KEEP_ALIVE_TIMEOUT_SECONDS,
  HEADERS_TIMEOUT_SECONDS,
  GRACEFUL_SHUTDOWN_TIMEOUT_SECONDS,
  KEEP_ALIVE_TIMEOUT_MS,
  HEADERS_TIMEOUT_MS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,

  // Database Connection
  POOL_MAX_PROD,
  POOL_MAX_DEV,
  POOL_MIN_PROD,
  POOL_MIN_DEV,
  MAX_IDLE_TIME_MS,
  WAIT_QUEUE_TIMEOUT_MS,
  SERVER_SELECTION_TIMEOUT_MS,
  SOCKET_TIMEOUT_MS,
  CONNECT_TIMEOUT_MS,
  HEARTBEAT_FREQUENCY_MS,
  WRITE_CONCERN_W,
  WRITE_CONCERN_J,
  WRITE_CONCERN_WTIMEOUT_MS,
  READ_CONCERN_LEVEL,
  READ_PREFERENCE,
  COMPRESSORS,
  ZLIB_COMPRESSION_LEVEL,
  MONITOR_COMMANDS_IN_DEV,
  READY_STATE_DISCONNECTED,
  READY_STATE_CONNECTED,
  READY_STATE_CONNECTING,
  READY_STATE_DISCONNECTING,
  READY_STATE_UNINITIALIZED,

  // MongoDB Error Codes
  MONGO_DUPLICATE_KEY_ERROR_CODE,

  // JWT
  JWT_SECRET_MIN_LENGTH,
  JWT_SECRET_MIN_ENTROPY,
  JWT_LIFETIME_MAX_DAYS,
  JWT_LIFETIME_MAX_HOURS,
  JWT_LIFETIME_MAX_MINUTES,
  JWT_LIFETIME_MAX_SECONDS,
  DEFAULT_JWT_LIFETIME,
  JWT_LIFETIME_REGEX,
  JWT_LIFETIME_REGEX_ERROR,

  // Rate Limiting
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,

  // Application
  DEFAULT_LOG_LEVEL,
  DEFAULT_REQUEST_SIZE_LIMIT,
  DEFAULT_CORS_ORIGIN,
  PORT_MIN,
  PORT_MAX,
  REQUEST_SIZE_LIMIT_REGEX,
  REQUEST_SIZE_LIMIT_REGEX_ERROR,

  // User Validation
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MODEL,
  LASTNAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,

  // Security
  BCRYPT_SALT_ROUNDS,

  // Pagination
  PAGE_DEFAULT,
  LIMIT_DEFAULT,
  LIMIT_MAX,

  // Job
  JOB_STATUS_ENUM,
  JOB_TYPE_ENUM,
  SORT_ORDER_ENUM,
  MONTHLY_STATS_LOOKBACK_MONTHS,

  // Mongoose
  MONGOOSE_OBJECT_ID_LENGTH,
};
