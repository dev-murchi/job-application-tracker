const sanitizeHtml = require('sanitize-html');
const logger = require('./logger');

const sanitize = (value) => {
  try {
    if (typeof value !== 'string') return value;
    return sanitizeHtml(value, {
      allowedSchemes: ['http', 'https'],
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape'
    });
  } catch (error) {
    logger.error('Error sanitizing value:', { value, error: error.message });
    throw error;
  }
};

const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return sanitize(data);
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeData(value);
  }
  return sanitized;
};


module.exports = sanitizeData;