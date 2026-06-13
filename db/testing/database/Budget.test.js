const mongoose = require('mongoose');
const Budget = require('../../models/Budget');
const User = require('../../models/User');

describe('Budget Model (Database)', () => {
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
    await Budget.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Budget Schema Validation', () => {
    it('should create a budget with valid data', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
        balance: 2000,
        status: 'Saving well - keep it up!',
      });

      expect(budget._id).toBeDefined();
      expect(budget.userId.toString()).toBe(testUser._id.toString());
      expect(budget.income).toBe(5000);
      expect(budget.expenses).toBe(3000);
      expect(budget.balance).toBe(2000);
    });

    it('should require userId field', async () => {
      const budget = new Budget({
        income: 5000,
        expenses: 3000,
      });

      await expect(budget.save()).rejects.toThrow();
    });

    it('should enforce one-to-one relationship with unique userId', async () => {
      await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      const budget2 = new Budget({
        userId: testUser._id,
        income: 6000,
        expenses: 4000,
      });

      await expect(budget2.save()).rejects.toThrow();
    });

    it('should set default values for numeric fields', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
      });

      expect(budget.income).toBe(0);
      expect(budget.expenses).toBe(0);
      expect(budget.balance).toBe(0);
      expect(budget.status).toBe('No budget data yet.');
    });

    it('should reject negative income', async () => {
      const budget = new Budget({
        userId: testUser._id,
        income: -1000,
        expenses: 0,
      });

      await expect(budget.save()).rejects.toThrow('Income cannot be negative');
    });

    it('should reject negative expenses', async () => {
      const budget = new Budget({
        userId: testUser._id,
        income: 5000,
        expenses: -1000,
      });

      await expect(budget.save()).rejects.toThrow('Expenses cannot be negative');
    });

    it('should reference User model', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      const populated = await budget.populate('userId');
      expect(populated.userId.email).toBe('test@example.com');
    });
  });

  describe('Budget Queries', () => {
    it('should find budget by userId', async () => {
      await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      const budget = await Budget.findOne({ userId: testUser._id });
      expect(budget).toBeDefined();
      expect(budget.income).toBe(5000);
    });

    it('should return null for non-existent budget', async () => {
      const budget = await Budget.findOne({ userId: testUser._id });
      expect(budget).toBeNull();
    });
  });

  describe('Budget Updates', () => {
    it('should update budget values', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
        balance: 2000,
      });

      budget.income = 6000;
      budget.expenses = 4000;
      budget.balance = 2000;
      await budget.save();

      const updated = await Budget.findById(budget._id);
      expect(updated.income).toBe(6000);
      expect(updated.expenses).toBe(4000);
    });

    it('should support upsert operation', async () => {
      const updated = await Budget.findOneAndUpdate(
        { userId: testUser._id },
        { income: 5500, expenses: 3500, balance: 2000 },
        { upsert: true, new: true }
      );

      expect(updated.income).toBe(5500);
      expect(updated.expenses).toBe(3500);
    });
  });

  describe('Budget Timestamps', () => {
    it('should track createdAt and updatedAt', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      expect(budget.createdAt).toBeDefined();
      expect(budget.updatedAt).toBeDefined();
      expect(budget.createdAt).toEqual(budget.updatedAt);
    });

    it('should update updatedAt when document changes', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
      });

      const original = budget.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 100));

      budget.income = 6000;
      await budget.save();

      expect(budget.updatedAt.getTime()).toBeGreaterThan(original.getTime());
    });
  });
});
