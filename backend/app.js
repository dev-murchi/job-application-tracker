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
const { appLevelRateLimit } = require('./middleware/rate-limiter');
const authenticateUser = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// Route imports
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const jobsRouter = require('./routes/jobs');

// Utilities
const logger = require('./utils/logger');
const sanitizeData = require('./utils/sanitize');
const { StatusCodes } = require('http-status-codes');

// Initialize express app
const app = express();

// Middleware setup

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
app.use(cookieParser());

// Apply rate limiting in production
if (config.isProduction) {
  app.use(appLevelRateLimit);
}

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

// API routes with authentication
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authenticateUser, userRouter);
app.use('/api/v1/jobs', authenticateUser, jobsRouter);

// 404 handler
app.use(notFoundMiddleware);

// Error handler (must be last)
app.use(errorHandlerMiddleware);

module.exports = {
  app,
};
