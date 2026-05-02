const mongoose = require('mongoose');
const { createJobSchema } = require('../schemas');
const { format, subMonths, startOfMonth } = require('date-fns');

/**@typedef {import('mongoose').Connection} MongooseConnection */
/**@typedef {import('../../../../../application/ports/driven/database/job.repository.port').JobRepositoryPort} JobRepositoryPort */

/**
 * Factory that creates a `JobRepositoryPort` adapter using a Mongoose connection.
 * @param {{ connection: MongooseConnection, configService: Object }} deps
 * @returns {JobRepositoryPort}
 */
const createMongoJobsRepository = ({ connection, configService }) => {
  const JobSchema = createJobSchema({ configService });
  const JobModel = connection.model('Job', JobSchema);

  return {
    create: async (data) => {
      return await JobModel.create(data);
    },
    findById: async (id) => {
      return await JobModel.findById(id);
    },
    find: async (filter, projection = null, options = {}) => {
      return await JobModel.find(filter, projection, options);
    },
    findWithPagination: async (filter, { sort = '-createdAt', skip = 0, limit = 10 } = {}) => {
      return await JobModel.find(filter).sort(sort).skip(skip).limit(limit);
    },
    count: async (filter) => {
      return await JobModel.countDocuments(filter);
    },
    updateById: async (id, data) => {
      return await JobModel.findOneAndUpdate({ _id: id }, data, { new: true, runValidators: true });
    },
    deleteById: async (id) => {
      return await JobModel.findByIdAndDelete(id);
    },

    getStatusDistributionForUser: async (userId) => {
      const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);

      const rawStats = await JobModel.aggregate([
        { $match: { createdBy: userObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      // Transform [{_id: 'pending', count: 5}] into {pending: 5}
      const statsMap = rawStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      return {
        pending: statsMap.pending || 0,
        interview: statsMap.interview || 0,
        offered: statsMap.offered || 0,
        accepted: statsMap.accepted || 0,
        declined: statsMap.declined || 0,
      };
    },

    getMonthlyCountsForUser: async (userId, lookbackMonths) => {
      const userObjectId = mongoose.Types.ObjectId.createFromHexString(userId);
      const startDate = startOfMonth(subMonths(new Date(), lookbackMonths - 1));
      const rawData = await JobModel.aggregate([
        {
          $match: {
            createdBy: userObjectId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
      ]);

      // Map Mongo results to a searchable object
      const monthlyMap = rawData.reduce((acc, item) => {
        acc[`${item._id.year}-${item._id.month}`] = item.count;
        return acc;
      }, {});

      // Generate the full list (including zeroes for missing months)
      return Array.from({ length: lookbackMonths })
        .map((_, i) => {
          const dateObj = subMonths(new Date(), i);
          const key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;
          return {
            date: format(dateObj, 'yyyy-MM'),
            count: monthlyMap[key] || 0,
          };
        })
        .reverse();
    },
  };
};

module.exports = { createMongoJobsRepository };
