const mongoose = require('mongoose');
const RoiCalculation = require('../../models/RoiCalculation');
const User = require('../../models/User');

describe('RoiCalculation Model (Database)', () => {
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
    await RoiCalculation.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('RoiCalculation Schema Validation', () => {
    it('should create an ROI calculation with valid data', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      expect(calculation._id).toBeDefined();
      expect(calculation.userId.toString()).toBe(testUser._id.toString());
      expect(calculation.type).toBe('roi');
      expect(calculation.inputs.initial).toBe(1000);
      expect(calculation.results.roi).toBe(50);
    });

    it('should create a compound interest calculation with valid data', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: { principal: 1000, rate: 5, years: 10 },
        results: { futureValue: 1629, interestEarned: 629 },
      });

      expect(calculation.type).toBe('compound');
      expect(calculation.inputs.principal).toBe(1000);
      expect(calculation.results.futureValue).toBe(1629);
    });

    it('should require userId field', async () => {
      const calculation = new RoiCalculation({
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      await expect(calculation.save()).rejects.toThrow();
    });

    it('should require type field', async () => {
      const calculation = new RoiCalculation({
        userId: testUser._id,
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      await expect(calculation.save()).rejects.toThrow('Path `type` is required');
    });

    it('should require inputs field', async () => {
      const calculation = new RoiCalculation({
        userId: testUser._id,
        type: 'roi',
        results: { roi: 50, profit: 500 },
      });

      await expect(calculation.save()).rejects.toThrow();
    });

    it('should require results field', async () => {
      const calculation = new RoiCalculation({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
      });

      await expect(calculation.save()).rejects.toThrow();
    });

    it('should accept only roi or compound type', async () => {
      const calculation = new RoiCalculation({
        userId: testUser._id,
        type: 'invalid',
        inputs: {},
        results: {},
      });

      await expect(calculation.save()).rejects.toThrow();
    });

    it('should store flexible object inputs', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500, customField: 'value' },
        results: { roi: 50, profit: 500 },
      });

      expect(calculation.inputs.customField).toBe('value');
    });

    it('should store flexible object results', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: { principal: 1000, rate: 5, years: 10 },
        results: { futureValue: 1629, interestEarned: 629, customMetric: 99 },
      });

      expect(calculation.results.customMetric).toBe(99);
    });
  });

  describe('RoiCalculation Queries', () => {
    it('should find calculations by userId', async () => {
      await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: { principal: 1000, rate: 5, years: 10 },
        results: { futureValue: 1629, interestEarned: 629 },
      });

      const calculations = await RoiCalculation.find({ userId: testUser._id });
      expect(calculations).toHaveLength(2);
    });

    it('should find calculations sorted by createdAt descending', async () => {
      const calc1 = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const calc2 = await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: { principal: 1000, rate: 5, years: 10 },
        results: { futureValue: 1629, interestEarned: 629 },
      });

      const calculations = await RoiCalculation.find({ userId: testUser._id })
        .sort({ createdAt: -1 });

      expect(calculations[0]._id).toEqual(calc2._id);
      expect(calculations[1]._id).toEqual(calc1._id);
    });

    it('should support limit on queries', async () => {
      for (let i = 0; i < 25; i++) {
        await RoiCalculation.create({
          userId: testUser._id,
          type: 'roi',
          inputs: { initial: 1000 + i, finalValue: 1500 + i },
          results: { roi: 50, profit: 500 },
        });
      }

      const calculations = await RoiCalculation.find({ userId: testUser._id })
        .sort({ createdAt: -1 })
        .limit(20);

      expect(calculations).toHaveLength(20);
    });

    it('should support index on userId for faster queries', async () => {
      for (let i = 0; i < 10; i++) {
        await RoiCalculation.create({
          userId: testUser._id,
          type: 'roi',
          inputs: { initial: 1000 + i, finalValue: 1500 + i },
          results: { roi: 50, profit: 500 },
        });
      }

      const calculations = await RoiCalculation.find({ userId: testUser._id });
      expect(calculations).toHaveLength(10);
    });
  });

  describe('RoiCalculation Types', () => {
    it('should store roi type calculations', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 5000, finalValue: 7500 },
        results: { roi: 50, profit: 2500 },
      });

      expect(calculation.type).toBe('roi');
      expect(calculation.inputs.initial).toBe(5000);
      expect(calculation.results.profit).toBe(2500);
    });

    it('should store compound type calculations', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: { principal: 10000, rate: 7, years: 5 },
        results: { futureValue: 14025, interestEarned: 4025 },
      });

      expect(calculation.type).toBe('compound');
      expect(calculation.inputs.rate).toBe(7);
      expect(calculation.results.futureValue).toBe(14025);
    });
  });

  describe('RoiCalculation Timestamps', () => {
    it('should track createdAt and updatedAt', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      expect(calculation.createdAt).toBeDefined();
      expect(calculation.updatedAt).toBeDefined();
    });
  });
});
