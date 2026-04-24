const config = require('./config');
const fs = require('fs/promises');
const { createUserSchema, createJobSchema } = require('./models');
const { createMongoConnectionManager } = require('./db/mongodb/mongo-connection-manager');

const configService = { get: (key) => config[key] };

const loggerService = {
  info: (msg, meta) => console.log('[info]', msg, meta ?? ''),
  warn: (msg, meta) => console.warn('[warn]', msg, meta ?? ''),
  error: (msg, meta) => console.error('[error]', msg, meta ?? ''),
  debug: () => {},
  http: () => {},
};

const populateJobs = async () => {
  const dbConnectionManager = createMongoConnectionManager({
    configService,
    loggerService,
  });

  const connection = dbConnectionManager.getDriverInstance();

  await dbConnectionManager.connect(config.mongoUrl);

  const User = connection.model('User', createUserSchema({ configService }));
  const Job = connection.model('Job', createJobSchema({ configService }));

  let user = await User.findOne({ email: 'test@user.com' });

  if (!user) {
    loggerService.info('Seed user not found — creating test user', { email: 'test@user.com' });
    // Create a minimal seed user that satisfies the model validators
    user = await User.create({
      name: 'Test User',
      email: 'test@user.com',
      password: 'TestPass.123',
      lastName: 'Seed',
      location: 'Remote',
    });
    loggerService.info('Seed user created', {
      id: user._id?.toString?.() || user._id,
      email: user.email,
    });
  }

  const jsonJobs = JSON.parse(await fs.readFile('./mockData.json', 'utf-8'));
  const jobs = jsonJobs.map((job) => ({ ...job, createdBy: user._id }));

  await Job.deleteMany({ createdBy: user._id });
  await Job.create(jobs);

  await dbConnectionManager.close();
};

populateJobs()
  .then(() => {
    console.log('Done — jobs populated successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
