const mongoose = require('mongoose');
const RiskProfile = require('../../models/RiskProfile');
const User = require('../../models/User');

describe('RiskProfile Model (Database)', () => {
  let testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    await RiskProfile.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('RiskProfile Schema Validation', () => {
    it('should create a risk profile with valid data', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 8,
        level: 'Moderate',
      });

      expect(profile._id).toBeDefined();
      expect(profile.userId.toString()).toBe(testUser._id.toString());
      expect(profile.score).toBe(8);
      expect(profile.level).toBe('Moderate');
    });

    it('should require userId field', async () => {
      const profile = new RiskProfile({
        score: 8,
        level: 'Moderate',
      });

      await expect(profile.save()).rejects.toThrow();
    });

    it('should enforce one-to-one relationship with unique userId', async () => {
      await RiskProfile.create({
        userId: testUser._id,
        score: 8,
        level: 'Moderate',
      });

      const profile2 = new RiskProfile({
        userId: testUser._id,
        score: 10,
        level: 'Aggressive',
      });

      await expect(profile2.save()).rejects.toThrow();
    });

    it('should set default score to 0', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
      });

      expect(profile.score).toBe(0);
    });

    it('should set default level to Moderate', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
      });

      expect(profile.level).toBe('Moderate');
    });

    it('should accept only Conservative level', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        level: 'Conservative',
      });

      expect(profile.level).toBe('Conservative');
    });

    it('should accept only Aggressive level', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        level: 'Aggressive',
      });

      expect(profile.level).toBe('Aggressive');
    });

    it('should reject invalid risk level', async () => {
      const profile = new RiskProfile({
        userId: testUser._id,
        level: 'InvalidLevel',
      });

      await expect(profile.save()).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const profile = new RiskProfile({
        userId: testUser._id,
        level: 'Unknown',
      });

      await expect(profile.save()).rejects.toThrow();
    });
  });

  describe('RiskProfile Queries', () => {
    it('should find risk profile by userId', async () => {
      await RiskProfile.create({
        userId: testUser._id,
        score: 8,
        level: 'Moderate',
      });

      const profile = await RiskProfile.findOne({ userId: testUser._id });
      expect(profile).toBeDefined();
      expect(profile.level).toBe('Moderate');
    });

    it('should return null for non-existent profile', async () => {
      const profile = await RiskProfile.findOne({ userId: testUser._id });
      expect(profile).toBeNull();
    });
  });

  describe('RiskProfile Updates', () => {
    it('should update risk score and level', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 8,
        level: 'Moderate',
      });

      profile.score = 12;
      profile.level = 'Aggressive';
      await profile.save();

      const updated = await RiskProfile.findById(profile._id);
      expect(updated.score).toBe(12);
      expect(updated.level).toBe('Aggressive');
    });

    it('should support upsert operation', async () => {
      const updated = await RiskProfile.findOneAndUpdate(
        { userId: testUser._id },
        { score: 10, level: 'Aggressive' },
        { upsert: true, new: true }
      );

      expect(updated.score).toBe(10);
      expect(updated.level).toBe('Aggressive');
    });
  });

  describe('RiskProfile Enum Constraints', () => {
    it('should enforce all three valid risk levels', async () => {
      const levels = ['Conservative', 'Moderate', 'Aggressive'];

      for (const level of levels) {
        const profile = await RiskProfile.create({
          userId: await User.create({
            name: `User for ${level}`,
            email: `${level}@example.com`,
            password: 'password123',
          }).then(u => u._id),
          level,
        });

        expect(profile.level).toBe(level);
      }
    });
  });

  describe('RiskProfile Timestamps', () => {
    it('should track createdAt and updatedAt', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 8,
        level: 'Moderate',
      });

      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });
  });
});
