const {
  UserRegisterSchema,
  UserLoginSchema,
  JobSearchQuerySchema,
  JobCreateSchema,
  JobUpdateSchema,
  MongooseObjectIdSchema,
  UserUpdateSchema,
} = require('../../utils');

describe('Validation Schema Utils', () => {
  describe('UserRegisterSchema', () => {
    it('should validate correct user registration data', () => {
      const data = {
        name: 'John Doe',
        lastName: 'Smith',
        email: 'john@example.com',
        password: 'securePass123',
        location: 'New York',
      };

      const result = UserRegisterSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should reject name shorter than 3 characters', () => {
      const data = {
        name: 'Jo',
        lastName: 'Smith',
        email: 'john@example.com',
        password: 'password',
        location: 'NY',
      };

      expect(() => UserRegisterSchema.parse(data)).toThrow();
    });

    it('should trim whitespace from name', () => {
      const data = {
        name: '  John  ',
        lastName: 'Smith',
        email: 'john@example.com',
        password: 'password',
        location: 'NY',
      };

      const result = UserRegisterSchema.parse(data);
      expect(result.name).toBe('John');
    });

    it('should reject empty lastName', () => {
      const data = {
        name: 'John',
        lastName: '',
        email: 'john@example.com',
        password: 'password',
        location: 'NY',
      };

      expect(() => UserRegisterSchema.parse(data)).toThrow();
    });

    it('should reject invalid email format', () => {
      const data = {
        name: 'John',
        lastName: 'Smith',
        email: 'invalid-email',
        password: 'password',
        location: 'NY',
      };

      expect(() => UserRegisterSchema.parse(data)).toThrow();
    });

    it('should reject empty password', () => {
      const data = {
        name: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        password: '',
        location: 'NY',
      };

      expect(() => UserRegisterSchema.parse(data)).toThrow();
    });

    it('should reject empty location', () => {
      const data = {
        name: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        password: 'password',
        location: '',
      };

      expect(() => UserRegisterSchema.parse(data)).toThrow();
    });
  });

  describe('UserLoginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = UserLoginSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'password',
      };

      expect(() => UserLoginSchema.parse(data)).toThrow();
    });

    it('should reject empty password', () => {
      const data = {
        email: 'user@example.com',
        password: '',
      };

      expect(() => UserLoginSchema.parse(data)).toThrow();
    });
  });

  describe('JobSearchQuerySchema', () => {
    it('should validate search query with all parameters', () => {
      const query = {
        search: 'engineer',
        status: 'interview',
        jobType: 'full-time',
        sort: 'newest',
        page: 2,
        limit: 20,
      };

      const result = JobSearchQuerySchema.parse(query);
      expect(result).toEqual(query);
    });

    it('should apply default values for sort, page, and limit', () => {
      const query = {};

      const result = JobSearchQuerySchema.parse(query);
      expect(result.sort).toBe('newest');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should reject search term shorter than 3 characters', () => {
      const query = { search: 'ab' };

      expect(() => JobSearchQuerySchema.parse(query)).toThrow();
    });

    it('should accept valid status values', () => {
      const validStatuses = ['interview', 'declined', 'pending', 'offered', 'accepted'];

      validStatuses.forEach((status) => {
        const result = JobSearchQuerySchema.parse({ status });
        expect(result.status).toBe(status);
      });
    });

    it('should reject invalid status values', () => {
      const query = { status: 'invalid-status' };

      expect(() => JobSearchQuerySchema.parse(query)).toThrow();
    });

    it('should accept valid jobType values', () => {
      const validTypes = ['full-time', 'part-time', 'internship'];

      validTypes.forEach((jobType) => {
        const result = JobSearchQuerySchema.parse({ jobType });
        expect(result.jobType).toBe(jobType);
      });
    });

    it('should reject invalid jobType', () => {
      const query = { jobType: 'freelance' };

      expect(() => JobSearchQuerySchema.parse(query)).toThrow();
    });

    it('should accept valid sort values', () => {
      const validSorts = ['a-z', 'z-a', 'newest', 'oldest'];

      validSorts.forEach((sort) => {
        const result = JobSearchQuerySchema.parse({ sort });
        expect(result.sort).toBe(sort);
      });
    });

    it('should coerce page to number', () => {
      const query = { page: '5' };

      const result = JobSearchQuerySchema.parse(query);
      expect(result.page).toBe(5);
      expect(typeof result.page).toBe('number');
    });

    it('should reject negative page number', () => {
      const query = { page: -1 };

      expect(() => JobSearchQuerySchema.parse(query)).toThrow();
    });

    it('should coerce limit to number', () => {
      const query = { limit: '25' };

      const result = JobSearchQuerySchema.parse(query);
      expect(result.limit).toBe(25);
    });

    it('should reject zero limit', () => {
      const query = { limit: 0 };

      expect(() => JobSearchQuerySchema.parse(query)).toThrow();
    });
  });

  describe('JobCreateSchema', () => {
    it('should validate correct job creation data', () => {
      const data = {
        company: 'Tech Corp',
        position: 'Software Engineer',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
      };

      const result = JobCreateSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should accept optional jobPostingUrl', () => {
      const data = {
        company: 'Tech Corp',
        position: 'Engineer',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
        jobPostingUrl: 'https://techcorp.com/jobs/123',
      };

      const result = JobCreateSchema.parse(data);
      expect(result.jobPostingUrl).toBe('https://techcorp.com/jobs/123');
    });

    it('should reject empty company name', () => {
      const data = {
        company: '',
        position: 'Engineer',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
      };

      expect(() => JobCreateSchema.parse(data)).toThrow();
    });

    it('should reject invalid companyWebsite URL', () => {
      const data = {
        company: 'Tech Corp',
        position: 'Engineer',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'not-a-url',
      };

      expect(() => JobCreateSchema.parse(data)).toThrow();
    });

    it('should reject invalid jobPostingUrl', () => {
      const data = {
        company: 'Tech Corp',
        position: 'Engineer',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
        jobPostingUrl: 'invalid-url',
      };

      expect(() => JobCreateSchema.parse(data)).toThrow();
    });

    it('should reject invalid job status', () => {
      const data = {
        company: 'Tech Corp',
        position: 'Engineer',
        jobType: 'full-time',
        jobLocation: 'Remote',
        status: 'invalid',
        companyWebsite: 'https://techcorp.com',
      };

      expect(() => JobCreateSchema.parse(data)).toThrow();
    });

    it('should reject invalid job type', () => {
      const data = {
        company: 'Tech Corp',
        position: 'Engineer',
        jobType: 'invalid-time',
        jobLocation: 'Remote',
        status: 'pending',
        companyWebsite: 'https://techcorp.com',
      };

      expect(() => JobCreateSchema.parse(data)).toThrow();
    });
  });

  describe('JobUpdateSchema', () => {
    it('should validate partial job update data', () => {
      const data = {
        company: 'New Corp',
        status: 'interview',
      };

      const result = JobUpdateSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should allow empty string for jobPostingUrl', () => {
      const data = {
        company: 'Corp',
        jobPostingUrl: '',
      };

      const result = JobUpdateSchema.parse(data);
      expect(result.jobPostingUrl).toBe('');
    });

    it('should allow valid URL for jobPostingUrl', () => {
      const data = {
        jobPostingUrl: 'https://example.com/job',
      };

      const result = JobUpdateSchema.parse(data);
      expect(result.jobPostingUrl).toBe('https://example.com/job');
    });

    it('should reject invalid URL for jobPostingUrl', () => {
      const data = {
        jobPostingUrl: 'not-a-url',
      };

      expect(() => JobUpdateSchema.parse(data)).toThrow();
    });

    it('should allow empty object (all fields optional)', () => {
      const data = {};

      const result = JobUpdateSchema.parse(data);
      expect(result).toEqual({});
    });

    it('should reject invalid job status', () => {
      const data = {
        status: 'invalid',
      };

      expect(() => JobUpdateSchema.parse(data)).toThrow();
    });

    it('should reject invalid job type', () => {
      const data = {
        jobType: 'invalid-time',
      };

      expect(() => JobUpdateSchema.parse(data)).toThrow();
    });
  });

  describe('MongooseObjectIdSchema', () => {
    it('should validate correct ObjectId format', () => {
      const validId = '507f1f77bcf86cd799439011';

      const result = MongooseObjectIdSchema.parse(validId);
      expect(result).toBe(validId);
    });

    it('should reject invalid ObjectId format', () => {
      const invalidId = 'invalid-id-123';

      expect(() => MongooseObjectIdSchema.parse(invalidId)).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => MongooseObjectIdSchema.parse('')).toThrow();
    });

    it('should trim whitespace', () => {
      const validId = '  507f1f77bcf86cd799439011  ';

      const result = MongooseObjectIdSchema.parse(validId);
      expect(result).toBe('507f1f77bcf86cd799439011');
    });

    it('should reject short strings', () => {
      const shortId = '12345';

      expect(() => MongooseObjectIdSchema.parse(shortId)).toThrow();
    });
  });

  describe('UserUpdateSchema', () => {
    it('should validate partial user update data', () => {
      const data = {
        name: 'Jane',
        email: 'jane@example.com',
      };

      const result = UserUpdateSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should allow updating single field', () => {
      const data = { location: 'San Francisco' };

      const result = UserUpdateSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should reject name shorter than 3 characters', () => {
      const data = { name: 'Jo' };

      expect(() => UserUpdateSchema.parse(data)).toThrow();
    });

    it('should reject empty lastName', () => {
      const data = { lastName: '' };

      expect(() => UserUpdateSchema.parse(data)).toThrow();
    });

    it('should reject invalid email', () => {
      const data = { email: 'invalid-email' };

      expect(() => UserUpdateSchema.parse(data)).toThrow();
    });

    it('should allow empty object', () => {
      const data = {};

      const result = UserUpdateSchema.parse(data);
      expect(result).toEqual({});
    });

    it('should trim whitespace from fields', () => {
      const data = {
        name: '  Jane  ',
        lastName: '  Doe  ',
      };

      const result = UserUpdateSchema.parse(data);
      expect(result.name).toBe('Jane');
      expect(result.lastName).toBe('Doe');
    });
  });
});
