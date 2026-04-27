const sanitizeHtml = require('sanitize-html');

/**
 * Create a sanitizer service with HTML sanitization capabilities
 * @returns {Object} Sanitizer object with sanitizeData method
 */
const createSanitizer = () => {
  /**
   * Sanitize a single string value by removing HTML tags
   * @param {*} value - Value to sanitize
   * @returns {*} Sanitized value (unchanged if not a string)
   * @throws {Error} If sanitization fails
   */
  const sanitize = (value) => {
    if (typeof value !== 'string') {
      return value;
    }
    return sanitizeHtml(value, {
      allowedSchemes: ['http', 'https'],
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape',
    });
  };

  /**
   * Recursively sanitize data structure (objects, arrays, primitives)
   * @param {*} data - Data to sanitize (can be object, array, or primitive)
   * @returns {*} Sanitized data with same structure
   */
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
      return data.map((item) => sanitizeData(item));
    }

    // Handle objects
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  };

  return {
    sanitizeData,
  };
};

module.exports = { createSanitizer };
