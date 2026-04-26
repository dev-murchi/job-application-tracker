const { HttpStatusCodes } = require('../../../constants');
const notFoundMiddleware = (req, res) =>
  res.status(HttpStatusCodes.NOT_FOUND).send('Route does not exist');

module.exports = notFoundMiddleware;
