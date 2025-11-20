const config = require('./config');

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
const { appLevelRateLimit, notFound, errorHandler } = require('./middleware');

// Utilities
const { logger, sanitizeData } = require('./utils');

/**
 * Factory function to create Express app with injected dependencies
 * @param {Object} options - Configuration options
 * @param {Array<Object>} options.routes - Array of route configurations
 * @param {string} options.routes[].path - Route path
 * @param {express.Router} options.routes[].router - Express router
 * @param {Array<Function>} [options.routes[].middleware] - Optional middleware array
 * @returns {express.Application} Configured Express application
 */
const createApp = ({ routes = [] }) => {
  // Initialize express app
  const app = express();

  // Middleware setup

  app.set('trust proxy', 1);
  // Apply rate limiting in production
  if (config.isProduction) {
    app.use(appLevelRateLimit);
  }

  // Body parsing with size limits
  app.use(
    express.json({
      limit: config.requestSizeLimit,
      parameterLimit: 100,
      type: ['application/json', 'application/json-patch+json'],
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: config.requestSizeLimit,
      parameterLimit: 100,
    }),
  );

  // Morgan logger configuration for production
  app.use(
    morgan(config.isProduction ? 'combined' : 'dev', {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );

  // Security middleware
  app.use(helmet());
  app.use(cookieParser());
  // XSS protection handled by sanitize-html in validation layer
  app.use((req, res, next) => {
    try {
      req.headers = sanitizeData(req.headers);
      req.body = sanitizeData(req.body);
      req.params = sanitizeData(req.params);
      req.query = sanitizeData(req.query);
      req.cookies = sanitizeData(req.cookies);
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use(mongoSanitize());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
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
      environment: config.nodeEnv,
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
  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp,
};
