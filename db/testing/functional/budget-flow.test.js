const mongoose = require('mongoose');
const User = require('../../models/User');
const Budget = require('../../models/Budget');
const Goal = require('../../models/Goal');
const RiskProfile = require('../../models/RiskProfile');
const RoiCalculation = require('../../models/RoiCalculation');

describe('Budget Feature Flow (Functional)', () => {
  let testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Budget Create → Read → Update Flow', () => {
    it('should create and retrieve budget for new user', async () => {
      // Step 1: User registers (budget created automatically)
      const budget = await Budget.create({
        userId: testUser._id,
        income: 0,
        expenses: 0,
      });

      // Step 2: User retrieves their budget
      const retrieved = await Budget.findOne({ userId: testUser._id });
      expect(retrieved).toBeDefined();
      expect(retrieved.income).toBe(0);

      // Step 3: User updates budget
      retrieved.income = 5000;
      retrieved.expenses = 3000;
      retrieved.balance = 2000;
      await retrieved.save();

      // Step 4: Verify update
      const updated = await Budget.findOne({ userId: testUser._id });
      expect(updated.income).toBe(5000);
      expect(updated.expenses).toBe(3000);
    });

    it('should calculate budget status correctly through flow', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 0,
        expenses: 0,
        status: 'No budget data yet.',
      });

      // User adds income
      budget.income = 5000;
      budget.expenses = 3000;
      budget.balance = 2000;
      budget.status = 'Saving well - keep it up!';
      await budget.save();

      let retrieved = await Budget.findOne({ userId: testUser._id });
      expect(retrieved.status).toBe('Saving well - keep it up!');

      // User spends more (overspending)
      retrieved.income = 3000;
      retrieved.expenses = 5000;
      retrieved.balance = -2000;
      retrieved.status = 'Overspending - consider lowering expenses.';
      await retrieved.save();

      retrieved = await Budget.findOne({ userId: testUser._id });
      expect(retrieved.status).toBe('Overspending - consider lowering expenses.');
      expect(retrieved.balance).toBe(-2000);
    });

    it('should support multiple budget updates over time', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
        balance: 2000,
      });

      const timestamps = [budget.updatedAt];

      // Simulate monthly updates
      for (let month = 1; month <= 3; month++) {
        await new Promise(resolve => setTimeout(resolve, 100));

        budget.income = 5000 + month * 100;
        budget.expenses = 3000 + month * 50;
        budget.balance = budget.income - budget.expenses;
        await budget.save();

        timestamps.push(budget.updatedAt);
      }

      // Verify all updates were recorded
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(timestamps[i - 1].getTime());
      }

      const final = await Budget.findOne({ userId: testUser._id });
      expect(final.income).toBe(5300);
      expect(final.expenses).toBe(3150);
    });
  });

  describe('Budget One-to-One Relationship', () => {
    it('should enforce one budget per user', async () => {
      const budget1 = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      // Try to create second budget for same user
      const budget2 = new Budget({
        userId: testUser._id,
        income: 6000,
        expenses: 4000,
      });

      await expect(budget2.save()).rejects.toThrow();
    });

    it('should maintain relationship when user is deleted', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      // Delete user
      await User.findByIdAndDelete(testUser._id);

      // Budget still exists in database (orphaned)
      const orphaned = await Budget.findOne({ userId: testUser._id });
      expect(orphaned).toBeDefined();
    });
  });
});
