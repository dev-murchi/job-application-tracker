const mongoose = require('mongoose')

const connectDB = (url) => {

  if (!url || typeof url !== 'string') {
    throw new Error('MongoDB connection URL is missing or invalid. Please set the MONGO_URL environment variable.');
  }
  return mongoose.connect(url);
}

module.exports = connectDB