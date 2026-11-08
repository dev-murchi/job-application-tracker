const mongoose = require('mongoose');
const {
  createTestConnection,
  closeTestConnection,
  clearDatabase,
  seedTestUser,
  createTestJob,
  getAllJobs,
} = require('./setup.integration');

describe('Jobs Repository Integration Tests', () => {
  let container;
  let jobRepository;
  let owner;
  let otherUser;
  let job;

  beforeAll(async () => {
    container = await createTestConnection('jobsRepository');
    jobRepository = container.jobRepository;
  });

  afterAll(async () => {
    await closeTestConnection(container);
  });

  beforeEach(async () => {
    await clearDatabase(container);

    owner = await seedTestUser(container, { email: 'owner@example.com' });
    otherUser = await seedTestUser(container, { email: 'other@example.com' });
    job = await createTestJob(container, owner._id, { company: 'Original Corp' });
  });

  const findStoredJob = async () => {
    const jobs = await getAllJobs(container, owner._id);
    return jobs.find((j) => j._id.toString() === job._id.toString());
  };

  describe('updateById', () => {
    it('should update the job when the owner matches', async () => {
      const updated = await jobRepository.updateById(job._id, owner._id.toString(), {
        company: 'Updated Corp',
      });

      expect(updated).not.toBeNull();
      expect(updated.company).toBe('Updated Corp');
      expect((await findStoredJob()).company).toBe('Updated Corp');
    });

    it('should return null and leave the job unchanged for a different owner', async () => {
      const updated = await jobRepository.updateById(job._id, otherUser._id.toString(), {
        company: 'Changed Corp',
      });

      expect(updated).toBeNull();
      expect((await findStoredJob()).company).toBe('Original Corp');
    });

    it('should return null when the job does not exist', async () => {
      await jobRepository.deleteById(job._id, owner._id.toString());

      const updated = await jobRepository.updateById(job._id, owner._id.toString(), {
        company: 'Ghost Corp',
      });

      expect(updated).toBeNull();
    });

    it.each([undefined, null, '', { $ne: null }, { $exists: true }])(
      'should throw when ownerId is %p',
      async (ownerId) => {
        await expect(jobRepository.updateById(job._id, ownerId, { company: 'X' })).rejects.toThrow(
          TypeError,
        );
        expect((await findStoredJob()).company).toBe('Original Corp');
      },
    );

    it('should still run schema validators on an owner-scoped update', async () => {
      await expect(
        jobRepository.updateById(job._id, owner._id.toString(), { status: 'not-a-status' }),
      ).rejects.toThrow();
      expect((await findStoredJob()).status).toBe('pending');
    });

    it('should return null for an id that never existed', async () => {
      const updated = await jobRepository.updateById(
        new mongoose.Types.ObjectId(),
        owner._id.toString(),
        { company: 'Ghost Corp' },
      );

      expect(updated).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete the job when the owner matches', async () => {
      const deleted = await jobRepository.deleteById(job._id, owner._id.toString());

      expect(deleted).not.toBeNull();
      expect(await findStoredJob()).toBeUndefined();
    });

    it('should return null and keep the job for a different owner', async () => {
      const deleted = await jobRepository.deleteById(job._id, otherUser._id.toString());

      expect(deleted).toBeNull();
      expect(await findStoredJob()).toBeDefined();
    });

    it('should return null when the job does not exist', async () => {
      await jobRepository.deleteById(job._id, owner._id.toString());

      const deleted = await jobRepository.deleteById(job._id, owner._id.toString());

      expect(deleted).toBeNull();
    });

    it.each([undefined, null, '', { $ne: null }, { $exists: true }])(
      'should throw when ownerId is %p',
      async (ownerId) => {
        await expect(jobRepository.deleteById(job._id, ownerId)).rejects.toThrow(TypeError);
        expect(await findStoredJob()).toBeDefined();
      },
    );
  });
});
