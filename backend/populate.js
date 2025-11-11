const config = require('./config');
const fs = require('fs/promises');
const { UserSchema, JobSchema } = require('./models');
const mongoose = require('mongoose');
const createConnectionManager = require('./db/connect');

const populateJobs = async () => {
  const connection = mongoose.createConnection();

  const User = connection.model('User', UserSchema);
  const Job = connection.model('Job', JobSchema);

  const dbConnectionManager = createConnectionManager({
    connection,
    config: { isProduction: false },
  });

  await dbConnectionManager.connect(config.mongoUrl);

  const user = await User.findOne({ email: 'test@user.com' });

  const jsonJobs = JSON.parse(await fs.readFile('./mockData.json', 'utf-8'));
  const jobs = jsonJobs.map((job) => {
    return { ...job, createdBy: user._id };
  });

  await Job.deleteMany({ createdBy: user._id });
  await Job.create(jobs);

  await dbConnectionManager.closeConnection();
};

populateJobs()
  .then(() => {
    console.log('Success!!!');
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
