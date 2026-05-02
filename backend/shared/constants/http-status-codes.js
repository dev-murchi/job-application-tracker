/**
 * HTTP Status Codes
 *
 * Defined per RFC 7231 (HTTP/1.1 Semantics and Content)
 * https://datatracker.ietf.org/doc/html/rfc7231#section-6
 *
 * Also includes codes from companion RFCs referenced in the RFC 7231
 * status-code registry table (Section 8.2.3):
 *   - RFC 7232 (Conditional Requests): 304, 412
 *   - RFC 7233 (Range Requests):       206, 416
 *   - RFC 7235 (Authentication):       401, 407
 */

// ==================== 1xx Informational ====================
const CONTINUE = 100;
const SWITCHING_PROTOCOLS = 101;

// ==================== 2xx Successful ====================
const OK = 200;
const CREATED = 201;
const ACCEPTED = 202;
const NON_AUTHORITATIVE_INFORMATION = 203;
const NO_CONTENT = 204;
const RESET_CONTENT = 205;
const PARTIAL_CONTENT = 206; // RFC 7233

// ==================== 3xx Redirection ====================
const MULTIPLE_CHOICES = 300;
const MOVED_PERMANENTLY = 301;
const FOUND = 302;
const SEE_OTHER = 303;
const NOT_MODIFIED = 304; // RFC 7232
const USE_PROXY = 305;
const UNUSED = 306;
const TEMPORARY_REDIRECT = 307;

// ==================== 4xx Client Error ====================
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401; // RFC 7235
const PAYMENT_REQUIRED = 402;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const METHOD_NOT_ALLOWED = 405;
const NOT_ACCEPTABLE = 406;
const PROXY_AUTHENTICATION_REQUIRED = 407; // RFC 7235
const REQUEST_TIMEOUT = 408;
const CONFLICT = 409;
const GONE = 410;
const LENGTH_REQUIRED = 411;
const PRECONDITION_FAILED = 412; // RFC 7232
const PAYLOAD_TOO_LARGE = 413;
const URI_TOO_LONG = 414;
const UNSUPPORTED_MEDIA_TYPE = 415;
const RANGE_NOT_SATISFIABLE = 416; // RFC 7233
const EXPECTATION_FAILED = 417;
const UPGRADE_REQUIRED = 426;

// ==================== 5xx Server Error ====================
const INTERNAL_SERVER_ERROR = 500;
const NOT_IMPLEMENTED = 501;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;
const HTTP_VERSION_NOT_SUPPORTED = 505;

module.exports = {
  // 1xx Informational
  CONTINUE,
  SWITCHING_PROTOCOLS,

  // 2xx Successful
  OK,
  CREATED,
  ACCEPTED,
  NON_AUTHORITATIVE_INFORMATION,
  NO_CONTENT,
  RESET_CONTENT,
  PARTIAL_CONTENT,

  // 3xx Redirection
  MULTIPLE_CHOICES,
  MOVED_PERMANENTLY,
  FOUND,
  SEE_OTHER,
  NOT_MODIFIED,
  USE_PROXY,
  UNUSED,
  TEMPORARY_REDIRECT,

  // 4xx Client Error
  BAD_REQUEST,
  UNAUTHORIZED,
  PAYMENT_REQUIRED,
  FORBIDDEN,
  NOT_FOUND,
  METHOD_NOT_ALLOWED,
  NOT_ACCEPTABLE,
  PROXY_AUTHENTICATION_REQUIRED,
  REQUEST_TIMEOUT,
  CONFLICT,
  GONE,
  LENGTH_REQUIRED,
  PRECONDITION_FAILED,
  PAYLOAD_TOO_LARGE,
  URI_TOO_LONG,
  UNSUPPORTED_MEDIA_TYPE,
  RANGE_NOT_SATISFIABLE,
  EXPECTATION_FAILED,
  UPGRADE_REQUIRED,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE,
  GATEWAY_TIMEOUT,
  HTTP_VERSION_NOT_SUPPORTED,
};
