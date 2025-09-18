require('dotenv').config();
require('express-async-errors');

// Core dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Security middleware imports
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Custom middleware imports
const authenticateUser = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// Route imports
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const jobsRouter = require('./routes/jobs');

// Utilities
const logger = require('./utils/logger');
const connectDB = require('./db/connect');

// Configuration
const config = {
  port: process.env.PORT || 3001,
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUrl: process.env.MONGO_URL,
};

// Rate limiter configurations
const rateLimiters = {
  global: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message:
      'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message:
      'Too many login/register attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// Initialize express app
const app = express();

// Morgan logger configuration
const morganStream = {
  write: (message) => logger.info(message.trim()),
};

// Middleware setup
const setupMiddleware = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    morgan(config.isProduction ? 'combined' : 'dev', { stream: morganStream })
  );
  app.use(helmet());
  app.use(xss());
  app.use(mongoSanitize());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(rateLimiters.global);
};

// Route setup
const setupRoutes = (app) => {
  app.get('/', (req, res) => res.send('home'));
  app.use('/api/v1/auth', rateLimiters.auth, authRouter);
  app.use('/api/v1/users', authenticateUser, userRouter);
  app.use('/api/v1/jobs', authenticateUser, jobsRouter);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);
};

// Server startup
const startServer = async () => {
  try {
    await connectDB(config.mongoUrl);
    logger.info('CONNECTED TO DB!!!');
    app.listen(config.port, () =>
      logger.info(`Server is listening on port ${config.port}...`)
    );
  } catch (error) {
    logger.error(error.stack || error);
  }
};

// Initialize application
setupMiddleware(app);
setupRoutes(app);
startServer();
