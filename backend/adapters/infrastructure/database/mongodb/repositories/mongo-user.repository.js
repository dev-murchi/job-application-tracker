/**@typedef {import('mongoose').Connection} MongooseConnection */
/**@typedef {import('../../../../../application/ports/driven/database/user.repository.port').UserRepositoryPort} UserRepositoryPort */

const { createUserSchema } = require('../schemas');

/**
 * Factory that creates a `UserRepositoryPort` adapter using a Mongoose connection.
 * @param {{ connection: MongooseConnection, configService: Object }} deps
 * @returns {UserRepositoryPort}
 */
const createMongoUserRepository = ({ connection, configService }) => {
  const UserSchema = createUserSchema({ configService });
  const UserModel = connection.model('User', UserSchema);

  return {
    findById: async (id) => {
      return await UserModel.findById(id).select('-password').lean();
    },
    findByEmail: async (email) => {
      return await UserModel.findOne({ email }).lean();
    },
    findByEmailWithPassword: async (email) => {
      return await UserModel.findOne({ email }).select('+password').lean();
    },
    create: async (data) => {
      return await UserModel.create(data);
    },
    updateById: async (id, data) => {
      return await UserModel.findOneAndUpdate({ _id: id }, data, {
        new: true,
        runValidators: true,
      });
    },
    findAllWithPassword: async () => {
      return await UserModel.find({}, '+password');
    },
    deleteById: async (id) => {
      return await UserModel.findByIdAndDelete(id);
    },
    count: async (filter) => {
      return await UserModel.countDocuments(filter);
    },
  };
};

module.exports = { createMongoUserRepository };
