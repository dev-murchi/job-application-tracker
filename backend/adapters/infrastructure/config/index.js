const { createEnvironmentConfigSource } = require('./sources/environment-config.source');
const { createConfigService } = require('./config.service');

module.exports = {
  createEnvironmentConfigSource,
  createConfigService,
};
