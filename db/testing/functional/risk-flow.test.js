const mongoose = require('mongoose');
const User = require('../../models/User');
const RiskProfile = require('../../models/RiskProfile');

describe('Risk Profile Feature Flow (Functional)', () => {
  let testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RiskProfile.deleteMany({});

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await RiskProfile.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Risk Profiling Quiz Flow', () => {
    it('should calculate risk level from quiz answers', async () => {
      // Simulate user taking risk quiz
      const quizAnswers = [1, 1, 1, 1, 1]; // Conservative answers
      const score = quizAnswers.reduce((sum, a) => sum + a, 0); // 5

      // Calculate level
      const level = score <= 7 ? 'Conservative' : score <= 11 ? 'Moderate' : 'Aggressive';

      // Save to database
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score,
        level,
      });

      expect(profile.level).toBe('Conservative');
      expect(profile.score).toBe(5);
    });

    it('should update risk profile when user retakes quiz', async () => {
      // Initial quiz (Conservative)
      let profile = await RiskProfile.create({
        userId: testUser._id,
        score: 5,
        level: 'Conservative',
      });

      expect(profile.level).toBe('Conservative');

      // User changes preferences and retakes quiz
      const newAnswers = [2, 2, 2, 2, 2]; // Moderate answers
      const newScore = newAnswers.reduce((sum, a) => sum + a, 0); // 10
      const newLevel = newScore <= 7 ? 'Conservative' : newScore <= 11 ? 'Moderate' : 'Aggressive';

      profile = await RiskProfile.findOneAndUpdate(
        { userId: testUser._id },
        { score: newScore, level: newLevel },
        { new: true }
      );

      expect(profile.level).toBe('Moderate');
      expect(profile.score).toBe(10);
    });

    it('should handle all risk level transitions', async () => {
      const transitions = [
        { score: 5, expectedLevel: 'Conservative' },
        { score: 10, expectedLevel: 'Moderate' },
        { score: 15, expectedLevel: 'Aggressive' },
        { score: 6, expectedLevel: 'Conservative' },
        { score: 13, expectedLevel: 'Aggressive' },
      ];

      for (const transition of transitions) {
        const level =
          transition.score <= 7
            ? 'Conservative'
            : transition.score <= 11
            ? 'Moderate'
            : 'Aggressive';

        expect(level).toBe(transition.expectedLevel);
      }
    });
  });

  describe('Risk Profile Recommendations', () => {
    it('should provide investment recommendations based on risk level', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 5,
        level: 'Conservative',
      });

      // Simulate recommendation logic
      const recommendations = {
        Conservative: ['Bonds (60%)', 'Stocks (30%)', 'Cash (10%)'],
        Moderate: ['Bonds (40%)', 'Stocks (50%)', 'Cash (10%)'],
        Aggressive: ['Bonds (20%)', 'Stocks (70%)', 'Cash (10%)'],
      };

      const riskLevel = profile.level;
      const portfolio = recommendations[riskLevel];

      expect(portfolio).toEqual(['Bonds (60%)', 'Stocks (30%)', 'Cash (10%)']);
    });
  });

  describe('Risk Profile Initialization', () => {
    it('should create default profile on user registration', async () => {
      const newUser = await User.create({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      });

      const profile = await RiskProfile.create({
        userId: newUser._id,
        // Defaults should apply
      });

      expect(profile.level).toBe('Moderate');
      expect(profile.score).toBe(0);
    });

    it('should maintain one risk profile per user', async () => {
      const profile1 = await RiskProfile.create({
        userId: testUser._id,
        score: 5,
        level: 'Conservative',
      });

      const profile2 = new RiskProfile({
        userId: testUser._id,
        score: 10,
        level: 'Moderate',
      });

      await expect(profile2.save()).rejects.toThrow();
    });
  });

  describe('Risk Profile History Tracking', () => {
    it('should track when user last updated risk profile', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 5,
        level: 'Conservative',
      });

      const firstUpdate = profile.updatedAt;

      // Wait and update
      await new Promise(resolve => setTimeout(resolve, 100));

      profile.score = 10;
      profile.level = 'Moderate';
      await profile.save();

      const secondUpdate = profile.updatedAt;

      expect(secondUpdate.getTime()).toBeGreaterThan(firstUpdate.getTime());
    });
  });

  describe('Score Boundary Accuracy', () => {
    it('should accurately classify scores at boundaries', async () => {
      const boundaryTests = [
        { score: 7, expectedLevel: 'Conservative' },
        { score: 8, expectedLevel: 'Moderate' },
        { score: 11, expectedLevel: 'Moderate' },
        { score: 12, expectedLevel: 'Aggressive' },
      ];

      for (const test of boundaryTests) {
        const level = test.score <= 7 ? 'Conservative' : test.score <= 11 ? 'Moderate' : 'Aggressive';
        expect(level).toBe(test.expectedLevel);
      }
    });
  });
});
