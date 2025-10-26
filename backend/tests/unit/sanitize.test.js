const sanitizeData = require('../../utils/sanitize');
const sanitizeHtml = require('sanitize-html');
const logger = require('../../utils/logger');

jest.mock('sanitize-html');

describe('Sanitize Utility - Minimal Tests for 100% Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sanitizeHtml.mockImplementation((value) => value);
  });

  describe('sanitizeData - primitives', () => {
    it('should return non-string values unchanged', () => {
      expect(sanitizeData(null)).toBeNull();
      expect(sanitizeData(undefined)).toBeUndefined();
      expect(sanitizeData(123)).toBe(123);
      expect(sanitizeData(true)).toBe(true);
    });

    it('should sanitize string values', () => {
      sanitizeHtml.mockReturnValueOnce('cleaned');
      const result = sanitizeData('<script>xss</script>');

      expect(sanitizeHtml).toHaveBeenCalledWith('<script>xss</script>', {
        allowedSchemes: ['http', 'https'],
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'recursiveEscape',
      });
      expect(result).toBe('cleaned');
    });
  });

  describe('sanitizeData - arrays', () => {
    it('should recursively sanitize all array elements', () => {
      sanitizeHtml.mockReturnValueOnce('clean1').mockReturnValueOnce('clean2');

      const result = sanitizeData(['<script>a</script>', '<img>b</img>', 123]);

      expect(result).toEqual(['clean1', 'clean2', 123]);
      expect(sanitizeHtml).toHaveBeenCalledTimes(2);
    });
  });

  describe('sanitizeData - objects', () => {
    it('should recursively sanitize all object values', () => {
      sanitizeHtml.mockReturnValueOnce('cleanName');

      const result = sanitizeData({
        name: '<b>test</b>',
        age: 30,
        active: true,
      });

      expect(result).toEqual({
        name: 'cleanName',
        age: 30,
        active: true,
      });
      expect(sanitizeHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe('sanitizeData - nested structures', () => {
    it('should handle nested objects and arrays', () => {
      sanitizeHtml
        .mockReturnValueOnce('cleanUser')
        .mockReturnValueOnce('cleanTag1')
        .mockReturnValueOnce('cleanTag2');

      const result = sanitizeData({
        user: { name: '<script>xss</script>' },
        tags: ['<b>tag1</b>', '<b>tag2</b>'],
      });

      expect(result).toEqual({
        user: { name: 'cleanUser' },
        tags: ['cleanTag1', 'cleanTag2'],
      });
    });
  });

  describe('error handling', () => {
    it('should log error and rethrow when sanitize-html throws', () => {
      const error = new Error('Sanitization error');
      sanitizeHtml.mockImplementation(() => {
        throw error;
      });

      expect(() => sanitizeData('test')).toThrow('Sanitization error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error sanitizing value:',
        expect.objectContaining({
          value: 'test',
          error: 'Sanitization error',
        }),
      );
    });
  });
});
