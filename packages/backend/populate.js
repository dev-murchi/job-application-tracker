const fs = require('fs/promises');
const connectDB = require('./db/connect');
const Job = require('./models/Job');

const populateJobs = async () => {
  await connectDB(process.env.MONGO_URL);

  const User = require('./models/User');
  const user = await User.findOne({ email: 'test@user.com' });

  const jsonJobs = JSON.parse(await fs.readFile('./mockData.json', 'utf-8'));
  const jobs = jsonJobs.map((job) => {
    return { ...job, createdBy: user._id };
  });

  await Job.deleteMany({ createdBy: user._id });
  await Job.create(jobs);
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
