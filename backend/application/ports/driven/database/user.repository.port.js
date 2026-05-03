const requiredMethods = [
  'findById',
  'findByEmail',
  'findByEmailWithPassword',
  'create',
  'updateById',
];
const userRepositoryContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`UserRepository adapter must implement '${method}()'`);
      }
    }
  },
};

/** @typedef {import("../../../../shared/dtos/user.dto").UserDTO} UserDTO */

/**
 * Port: UserRepository
 *
 * Driven port — used by the application layer to persist and retrieve user data.
 * Any adapter bound to USER_REPOSITORY_PORT must satisfy this interface.
 * Methods return plain objects rather than ORM documents.
 *
 * @typedef {Object} UserRepositoryPort
 * @property {(id: string) => Promise<Record<string, any>|null>}                    findById                - Find a user by ID (password excluded).
 * @property {(email: string) => Promise<Record<string, any>|null>}                 findByEmail             - Find a user by email (password excluded).
 * @property {(email: string) => Promise<Record<string, any>|null>}                 findByEmailWithPassword - Find a user by email including the password field.
 * @property {(data: Object) => Promise<Record<string, any>>}                       create                  - Persist a new user and return the created document.
 * @property {(id: string, data: Object) => Promise<Record<string, any>|null>}      updateById              - Update a user by ID and return the updated document.
 * @property {() => Promise<Array<Record<string, any>>>}                            findAllWithPassword     - Return all users including the password field (admin/test use only).
 * @property {(id: string) => Promise<Record<string, any>|null>}                    deleteById              - Delete a user by ID and return the deleted document.
 * @property {(filter?: Object) => Promise<number>}                                 count                   - Count users matching an optional filter.
 */

module.exports = { userRepositoryContract };
