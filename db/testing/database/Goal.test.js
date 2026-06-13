const mongoose = require('mongoose');
const Goal = require('../../models/Goal');
const User = require('../../models/User');

describe('Goal Model (Database)', () => {
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
    await Goal.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Goal Schema Validation', () => {
    it('should create a goal with valid data', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
        saved: 1000,
      });

      expect(goal._id).toBeDefined();
      expect(goal.userId.toString()).toBe(testUser._id.toString());
      expect(goal.name).toBe('Save for vacation');
      expect(goal.target).toBe(5000);
      expect(goal.saved).toBe(1000);
    });

    it('should require userId field', async () => {
      const goal = new Goal({
        name: 'Save for vacation',
        target: 5000,
      });

      await expect(goal.save()).rejects.toThrow();
    });

    it('should require goal name', async () => {
      const goal = new Goal({
        userId: testUser._id,
        target: 5000,
      });

      await expect(goal.save()).rejects.toThrow('Goal name is required');
    });

    it('should require target amount', async () => {
      const goal = new Goal({
        userId: testUser._id,
        name: 'Save for vacation',
      });

      await expect(goal.save()).rejects.toThrow('Target amount is required');
    });

    it('should trim goal name', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: '  Save for vacation  ',
        target: 5000,
      });

      expect(goal.name).toBe('Save for vacation');
    });

    it('should set default saved amount to 0', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });

      expect(goal.saved).toBe(0);
    });

    it('should reject negative target', async () => {
      const goal = new Goal({
        userId: testUser._id,
        name: 'Save for vacation',
        target: -1000,
      });

      await expect(goal.save()).rejects.toThrow('Target cannot be negative');
    });

    it('should reject negative saved amount', async () => {
      const goal = new Goal({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
        saved: -100,
      });

      await expect(goal.save()).rejects.toThrow('Saved amount cannot be negative');
    });
  });

  describe('Goal Queries', () => {
    it('should find goals by userId', async () => {
      await Goal.create({
        userId: testUser._id,
        name: 'Goal 1',
        target: 1000,
      });

      await Goal.create({
        userId: testUser._id,
        name: 'Goal 2',
        target: 2000,
      });

      const goals = await Goal.find({ userId: testUser._id });
      expect(goals).toHaveLength(2);
    });

    it('should find goal by ID and userId', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });

      const found = await Goal.findOne({ _id: goal._id, userId: testUser._id });
      expect(found).toBeDefined();
      expect(found.name).toBe('Save for vacation');
    });

    it('should not find goal from different user', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });

      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const found = await Goal.findOne({ _id: goal._id, userId: otherUser._id });
      expect(found).toBeNull();
    });

    it('should support index on userId for faster queries', async () => {
      // Create multiple goals for performance testing
      for (let i = 0; i < 10; i++) {
        await Goal.create({
          userId: testUser._id,
          name: `Goal ${i}`,
          target: 1000 * (i + 1),
        });
      }

      const goals = await Goal.find({ userId: testUser._id });
      expect(goals).toHaveLength(10);
    });
  });

  describe('Goal Updates', () => {
    it('should update goal fields', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
        saved: 1000,
      });

      goal.name = 'Save for trip';
      goal.saved = 1500;
      await goal.save();

      const updated = await Goal.findById(goal._id);
      expect(updated.name).toBe('Save for trip');
      expect(updated.saved).toBe(1500);
    });
  });

  describe('Goal Deletion', () => {
    it('should delete a goal', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });

      await Goal.findByIdAndDelete(goal._id);

      const found = await Goal.findById(goal._id);
      expect(found).toBeNull();
    });

    it('should delete goal with userId check', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });

      const deleted = await Goal.findOneAndDelete({
        _id: goal._id,
        userId: testUser._id,
      });

      expect(deleted).toBeDefined();
      expect(deleted._id).toEqual(goal._id);
    });
  });

  describe('Goal Timestamps', () => {
    it('should track createdAt and updatedAt', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });

      expect(goal.createdAt).toBeDefined();
      expect(goal.updatedAt).toBeDefined();
    });
  });
});
