/**
 * Mongoose connection type alias.
 * @typedef {import('mongoose').Connection} MongooseConnection
 *
 * Lightweight, production-ready repository contract for users.
 * Methods return plain objects (lean) where appropriate and avoid Mongoose documents.
 * @typedef {Object} UserRepository
 * @property {(id: string) => Promise<Record<string, any>|null>} findById
 * @property {(email: string) => Promise<Record<string, any>|null>} findByEmail
 * @property {(email: string) => Promise<Record<string, any>|null>} findByEmailWithPassword
 * @property {(data: Object) => Promise<Record<string, any>>} create
 * @property {(id: string, data: Object) => Promise<Record<string, any>|null>} updateById
 * @property {() => Promise<Array<Record<string, any>>>} findAllWithPassword
 * @property {(id: string) => Promise<Record<string, any>|null>} deleteById
 * @property {(filter?: Object) => Promise<number>} count
 *
 * Factory that creates a `UserRepository` using a Mongoose `connection`.
 * @typedef {function({connection: MongooseConnection, configService: Object}): UserRepository} createMongoUserRepository
 */
const { createUserSchema } = require('../schemas');

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
