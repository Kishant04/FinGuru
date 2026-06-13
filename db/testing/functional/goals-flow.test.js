const mongoose = require('mongoose');
const User = require('../../models/User');
const Goal = require('../../models/Goal');

describe('Goal Feature Flow (Functional)', () => {
  let testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Goal CRUD Feature Flow', () => {
    it('should create, read, update, delete goals', async () => {
      // CREATE: User creates a goal
      const goal1 = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
        saved: 0,
      });

      expect(goal1._id).toBeDefined();

      // READ: User retrieves all goals
      let goals = await Goal.find({ userId: testUser._id });
      expect(goals).toHaveLength(1);

      // CREATE: User creates another goal
      const goal2 = await Goal.create({
        userId: testUser._id,
        name: 'Emergency fund',
        target: 10000,
        saved: 2000,
      });

      goals = await Goal.find({ userId: testUser._id });
      expect(goals).toHaveLength(2);

      // UPDATE: User adds savings to goal1
      goal1.saved = 1500;
      await goal1.save();

      let updated = await Goal.findById(goal1._id);
      expect(updated.saved).toBe(1500);

      // UPDATE: User changes goal2 target
      goal2.target = 15000;
      goal2.name = 'Emergency fund - expanded';
      await goal2.save();

      updated = await Goal.findById(goal2._id);
      expect(updated.target).toBe(15000);
      expect(updated.name).toBe('Emergency fund - expanded');

      // DELETE: User deletes goal1
      await Goal.findByIdAndDelete(goal1._id);

      goals = await Goal.find({ userId: testUser._id });
      expect(goals).toHaveLength(1);
      expect(goals[0]._id).toEqual(goal2._id);

      // DELETE: User deletes remaining goal
      await Goal.findByIdAndDelete(goal2._id);

      goals = await Goal.find({ userId: testUser._id });
      expect(goals).toHaveLength(0);
    });
  });

  describe('Goal Progress Tracking', () => {
    it('should track goal progress over time', async () => {
      const goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for car',
        target: 20000,
        saved: 0,
      });

      const progressPoints = [];

      // Simulate monthly savings deposits
      for (let month = 1; month <= 12; month++) {
        goal.saved = month * 1500;
        await goal.save();

        const progress = Math.round((goal.saved / goal.target) * 100);
        progressPoints.push(progress);
      }

      // Verify progress increased over time
      for (let i = 1; i < progressPoints.length; i++) {
        expect(progressPoints[i]).toBeGreaterThan(progressPoints[i - 1]);
      }

      // Final progress should be close to 90%
      const finalProgress = Math.round((goal.saved / goal.target) * 100);
      expect(finalProgress).toBe(90);
    });

    it('should handle multiple goals with different progress', async () => {
      const goals = await Promise.all([
        Goal.create({
          userId: testUser._id,
          name: 'Goal 1',
          target: 5000,
          saved: 4500,
        }),
        Goal.create({
          userId: testUser._id,
          name: 'Goal 2',
          target: 10000,
          saved: 2000,
        }),
        Goal.create({
          userId: testUser._id,
          name: 'Goal 3',
          target: 1000,
          saved: 1000,
        }),
      ]);

      const allGoals = await Goal.find({ userId: testUser._id });
      expect(allGoals).toHaveLength(3);

      // Calculate aggregate savings
      const totalTarget = allGoals.reduce((sum, g) => sum + g.target, 0);
      const totalSaved = allGoals.reduce((sum, g) => sum + g.saved, 0);
      const aggregateProgress = Math.round((totalSaved / totalTarget) * 100);

      expect(aggregateProgress).toBe(47); // (4500 + 2000 + 1000) / (5000 + 10000 + 1000) = 7500/16000
    });
  });

  describe('Goal Data Consistency', () => {
    it('should maintain data consistency with concurrent operations', async () => {
      const goal1 = await Goal.create({
        userId: testUser._id,
        name: 'Goal 1',
        target: 5000,
        saved: 0,
      });

      const goal2 = await Goal.create({
        userId: testUser._id,
        name: 'Goal 2',
        target: 10000,
        saved: 0,
      });

      // Simulate concurrent updates
      goal1.saved = 1000;
      goal2.saved = 2000;

      await Promise.all([goal1.save(), goal2.save()]);

      const allGoals = await Goal.find({ userId: testUser._id });
      expect(allGoals[0].saved).toBe(1000);
      expect(allGoals[1].saved).toBe(2000);
    });

    it('should sort goals by creation date', async () => {
      const goal1 = await Goal.create({
        userId: testUser._id,
        name: 'First goal',
        target: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const goal2 = await Goal.create({
        userId: testUser._id,
        name: 'Second goal',
        target: 10000,
      });

      const goals = await Goal.find({ userId: testUser._id }).sort({ createdAt: -1 });
      expect(goals[0]._id).toEqual(goal2._id);
      expect(goals[1]._id).toEqual(goal1._id);
    });
  });

  describe('Goal User Isolation', () => {
    it('should isolate goals between different users', async () => {
      const user2 = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const goal1 = await Goal.create({
        userId: testUser._id,
        name: 'User 1 goal',
        target: 5000,
      });

      const goal2 = await Goal.create({
        userId: user2._id,
        name: 'User 2 goal',
        target: 10000,
      });

      // Each user should only see their own goals
      const user1Goals = await Goal.find({ userId: testUser._id });
      const user2Goals = await Goal.find({ userId: user2._id });

      expect(user1Goals).toHaveLength(1);
      expect(user2Goals).toHaveLength(1);
      expect(user1Goals[0]._id).toEqual(goal1._id);
      expect(user2Goals[0]._id).toEqual(goal2._id);
    });

    it('should prevent users from modifying other user goals', async () => {
      const user2 = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const goal = await Goal.create({
        userId: testUser._id,
        name: 'User 1 goal',
        target: 5000,
      });

      // Try to find and update as different user
      const found = await Goal.findOne({
        _id: goal._id,
        userId: user2._id,
      });

      expect(found).toBeNull();
    });
  });
});
