const requiredMethods = ['getHealthStatus'];
const healthServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`HealthService adapter must implement '${method}()'`);
      }
    }
  },
};

module.exports = { healthServiceContract };
