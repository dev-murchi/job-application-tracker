const createDbService = (conn) => {
  const modelsRegistry = new Map();

  const createModel = (modelName, schema) => {
    if (!conn) {
      throw new Error('Cannot create model: Mongoose connection instance is missing.');
    }
    const model = conn.model(modelName, schema);

    modelsRegistry.set(modelName, model);
  };

  const getModel = (modelName) => {
    const model = modelsRegistry.get(modelName);
    if (!model) {
      throw new Error(`Database Service Error: Model '${modelName}' is uninitialized.`);
    }
    return model;
  };
  return {
    createModel,
    getModel,
  };
};

module.exports = { createDbService };
