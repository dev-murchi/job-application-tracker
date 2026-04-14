# Security Guide

This document describes the security features, practices, and configuration of the Job Application Tracker.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [Rate Limiting](#rate-limiting)
4. [Security Headers](#security-headers)
5. [CORS Configuration](#cors-configuration)
6. [Password Security](#password-security)
7. [Transport Security](#transport-security)
8. [Docker Security](#docker-security)
9. [Environment Variables & Secrets](#environment-variables--secrets)
10. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT-Based Authentication

The application uses JSON Web Tokens (JWT) for stateless authentication.

- **Token Storage**: HTTP-only, secure cookies (not accessible via JavaScript)
- **Token Lifetime**: Configurable via `JWT_LIFETIME` (default: `30d`)
- **Secret Validation**: JWT secrets are validated for minimum length (32 characters) and entropy using Shannon entropy calculation
- **User Isolation**: Each user can only access their own jobs and profile

### Token Flow

1. User registers or logs in → server creates a JWT
2. JWT is stored in an HTTP-only cookie → sent automatically with requests
3. Protected routes verify the JWT via middleware
4. Logout clears the cookie

---

## Input Validation & Sanitization

### Zod Schema Validation

All API inputs are validated using [Zod](https://zod.dev/) schemas before processing:

- **User registration/update**: Validated via [`UserUpdateSchema`](../backend/schemas/user.schemas.js)
- **Configuration**: Validated via [`ConfigSchema`](../backend/schemas/config.schemas.js) with strict type coercion
- **Schema mode**: `.strict()` — rejects any extra/unexpected fields

### MongoDB Injection Protection

- Input is sanitized to prevent NoSQL injection attacks
- Mongoose schema validation provides an additional layer

### XSS Protection

- Request data is sanitized to strip potentially malicious scripts
- Helmet security headers prevent various XSS attack vectors

---

## Rate Limiting

API requests are rate-limited per IP address to prevent abuse:

| Setting                  | Default    | Environment Variable       |
|--------------------------|------------|----------------------------|
| Window duration          | 15 minutes | `RATE_LIMIT_WINDOW_MS`     |
| Max requests per window  | 100        | `RATE_LIMIT_MAX_REQUESTS`  |

When exceeded, the API returns `429 Too Many Requests`.

---

## Security Headers

[Helmet](https://helmetjs.github.io/) is used to set security-related HTTP headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (modern browsers use CSP instead)
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- And others as configured by Helmet defaults

---

## CORS Configuration

Cross-Origin Resource Sharing is configured via the `CORS_ORIGIN` environment variable:

| Environment | Recommended Value             |
|-------------|-------------------------------|
| Development | `http://localhost:4200`       |
| Production  | `https://yourdomain.com`      |

The default is `*` (allow all origins), but this should **always** be restricted in production.

---

## Password Security

- **Hashing**: Passwords are hashed using bcrypt with a salt rounds factor of 10 (see [`BCRYPT_SALT_ROUNDS`](../backend/constants/index.js))
- **Minimum Length**: 8 characters (enforced at the API schema level)
- **Storage**: Only the bcrypt hash is stored — plaintext passwords are never persisted
- **Response Filtering**: Password hashes are never included in API responses

---

## Transport Security

### Production (Public HTTPS)

- **Let's Encrypt** certificates terminate public TLS at the host NGINX
- Auto-renewed via certbot cron job

### Internal (mTLS)

- Communication between host NGINX and the frontend Docker container uses mutual TLS
- Both the server (frontend container) and client (host NGINX) present certificates
- Signed by a private CA created during setup

See [Infrastructure — mTLS Certificate Generation](INFRASTRUCTURE.md#3-mtls-certificate-generation) for setup details.

### Local Development

- HTTP-only (no TLS overhead in dev)
- Prod-demo profile uses self-signed certificates for testing the HTTPS flow

---

## Docker Security

### Production Image Hardening

The [backend Dockerfile](../backend/Dockerfile) implements several security practices:

- **Non-root user**: Application runs as `appuser` (not root)
- **Minimal image**: Based on `node:22-alpine` (small attack surface)
- **Package manager removal**: npm, yarn, and corepack are removed from the production image
- **Multi-stage builds**: Development dependencies are excluded from the production image
- **Read-only filesystem**: Only the `logs` directory is writable

### Docker Swarm Secrets

Sensitive values are managed via Docker Swarm secrets (not environment variables):

| Secret                  | Purpose                        |
|-------------------------|--------------------------------|
| `mongodb_url_v<N>`      | MongoDB connection string      |
| `jwt_secret_v<N>`       | JWT signing secret             |
| `ssl_ca_crt_v<N>`       | CA certificate (mTLS)          |
| `frontend_crt_v<N>`     | Server certificate (mTLS)      |
| `frontend_privkey_v<N>` | Server private key (mTLS)      |

Secrets are mounted as files inside containers and read at startup. Versioned naming enables safe rotation and rollback.

---

## Environment Variables & Secrets

### Local Development

Environment variables are stored in `.env.*` files (excluded from version control via `.gitignore`):

- `.env.dev` — development settings
- `.env.test` — test settings
- `.env.prod-demo` — local production simulation

### Production

- **Non-sensitive config**: Passed as environment variables via the CI/CD pipeline (GitHub Variables)
- **Sensitive values**: Stored as Docker Swarm secrets, read from files at container startup
- The backend [`config/index.js`](../backend/config/index.js) uses a `readSecret()` helper that checks for `*_FILE` environment variables first

### Configuration Validation

All configuration is validated at startup using Zod schemas ([`ConfigSchema`](../backend/schemas/config.schemas.js)):

- Type checking and coercion
- Range validation (ports, rate limits)
- Format validation (JWT lifetime, request size)
- JWT secret entropy validation (Shannon entropy ≥ threshold)
- Invalid configuration causes the application to fail fast with descriptive error messages

---

## Security Checklist

### Before Deploying to Production

- [ ] Generate a strong JWT secret (64+ characters, high entropy)
- [ ] Set strong MongoDB credentials
- [ ] Set `CORS_ORIGIN` to your exact domain (not `*`)
- [ ] Set `NODE_ENV=production`
- [ ] Review rate limiting settings
- [ ] Ensure Docker Swarm secrets are created (not env vars)
- [ ] Verify Let's Encrypt certificate is active
- [ ] Verify mTLS certificates are valid and not expired
- [ ] Confirm firewall rules (only ports 80, 443, and SSH)
- [ ] Test that internal services are not publicly accessible
- [ ] Verify non-root user is used in production containers

### Regular Maintenance

- [ ] Monitor certbot auto-renewal (Let's Encrypt)
- [ ] Rotate mTLS certificates before expiry (365 days)
- [ ] Rotate JWT secret periodically
- [ ] Update Docker base images for security patches
- [ ] Review application logs for suspicious activity
- [ ] Update Node.js and npm dependencies