const createValidatorFn = (property) => (schema) => {
  return (req, res, next) => {
    try {
      req[property] = schema.parse(req[property]);
      next();
    } catch (error) {
      throw error;
    }
  };
};

const validateBody = createValidatorFn('body');
const validateHeaders = createValidatorFn('headers');
const validateParams = createValidatorFn('params');
const validateQuery = createValidatorFn('query');

module.exports = {
  validateBody,
  validateHeaders,
  validateParams,
  validateQuery,
};
