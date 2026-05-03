/**@typedef {import('zod').ZodSchema} ZodSchema */
/**@typedef {import('express').RequestHandler} ExpressRequestHandler */

/**
 * Higher-order function that creates a Zod-backed Express validation middleware
 * targeting a specific request property.
 * @param {'body'|'headers'|'params'|'query'} property - The request property to validate.
 * @returns {(schema: ZodSchema) => ExpressRequestHandler}
 */
const createValidatorFn = (property) => (schema) => {
  return (req, res, next) => {
    req[property] = schema.parse(req[property]);
    next();
  };
};

/** @type {(schema: ZodSchema) => ExpressRequestHandler} */
const validateBody = createValidatorFn('body');
/** @type {(schema: ZodSchema) => ExpressRequestHandler} */
const validateHeaders = createValidatorFn('headers');
/** @type {(schema: ZodSchema) => ExpressRequestHandler} */
const validateParams = createValidatorFn('params');
/** @type {(schema: ZodSchema) => ExpressRequestHandler} */
const validateQuery = createValidatorFn('query');

module.exports = {
  validateBody,
  validateHeaders,
  validateParams,
  validateQuery,
};
