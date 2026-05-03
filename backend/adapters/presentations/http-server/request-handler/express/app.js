require('express-async-errors');

// Core dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Security middleware imports
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

// Custom middleware imports
const { createRateLimiters, notFound, createErrorHandler } = require('./rest/middlewares');

// Utilities
const { createSanitizer } = require('../../../../infrastructure/security/sanitize');

/**@typedef {import('../../../../../application/ports/driven/config/config-service.port').ConfigServicePort} ConfigServicePort*/
/**@typedef {import('../../../../../application/ports/driven/logger/logger.service.port').LoggerServicePort} LoggerServicePort*/

/**
 * Factory function to create Express app with injected dependencies
 * @param {Object} options - Configuration options
 * @param {Array<Object>} options.routes - Array of route configurations
 * @param {string} options.routes[].path - Route path
 * @param {express.Router} options.routes[].router - Express router
 * @param {Array<Function>} [options.routes[].middleware] - Optional middleware array
 * @param {LoggerServicePort} options.loggerService - Logger service instance for application logging
 * @param {ConfigServicePort} options.configService - Configuration service for app settings
 * @returns {express.Application} Configured Express application
 */
const createApp = ({ routes = [], loggerService, configService }) => {
  const isProduction = configService.get('isProduction');
  const requestSizeLimit = configService.get('requestSizeLimit');
  const corsOrigin = configService.get('corsOrigin');
  const trustProxyHops = configService.get('trustProxyHops');
  const nodeEnv = configService.get('nodeEnv');

  // Create middleware with injected dependencies
  const sanitizer = createSanitizer();
  const errorHandler = createErrorHandler({ configService });
  const { appLevelRateLimit } = createRateLimiters({ configService });

  // Initialize express app
  const app = express();

  // Middleware setup

  // Make proxy trust configurable for different deployment topologies.
  app.set('trust proxy', trustProxyHops);

  // Apply rate limiting in production
  if (isProduction) {
    app.use(appLevelRateLimit);
  }

  // Body parsing with size limits
  app.use(
    express.json({
      limit: requestSizeLimit,
      parameterLimit: 100,
      type: ['application/json', 'application/json-patch+json'],
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: requestSizeLimit,
      parameterLimit: 100,
    }),
  );

  // Morgan logger configuration for production
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      stream: { write: (message) => loggerService.info(message.trim()) },
    }),
  );

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());
  // XSS protection handled by sanitize-html in validation layer
  app.use((req, res, next) => {
    try {
      req.headers = sanitizer.sanitizeData(req.headers);
      req.body = sanitizer.sanitizeData(req.body);
      req.params = sanitizer.sanitizeData(req.params);
      req.query = sanitizer.sanitizeData(req.query);
      req.cookies = sanitizer.sanitizeData(req.cookies);
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use(mongoSanitize());

  const allowCredentials = corsOrigin !== '*';

  if (isProduction && !allowCredentials) {
    loggerService.warn(
      'CORS is configured with "*" in production; disabling credentials to prevent cookie leakage',
    );
  }

  app.use(
    cors({
      origin: corsOrigin,
      credentials: allowCredentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      optionsSuccessStatus: 204,
      maxAge: 86400, // Cache preflight for 24 hours
    }),
  );

  // Route setup

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Job Tracker API',
      version: process.env.npm_package_version || '1.0.0',
      environment: nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // Register all routes
  routes.forEach(({ path, router, middleware = [] }) => {
    if (middleware.length > 0) {
      app.use(path, ...middleware, router);
    } else {
      app.use(path, router);
    }
  });

  // 404 handler
  app.use(notFound);

  // Error handler (must be last)
  app.use((err, req, res, _next) => {
    loggerService.error('Error occurred:', {
      message: err.message,
      issues: err.issues || [],
      stack: isProduction ? undefined : err.stack,
      url: req.url,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req.user && req.user.userId) || 'anonymous',
    });

    errorHandler(err, req, res, _next);
  });

  return app;
};

module.exports = {
  createApp,
};
