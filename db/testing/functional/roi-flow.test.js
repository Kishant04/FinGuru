require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../../models/User');
const RoiCalculation = require('../../models/RoiCalculation');

describe('ROI Calculation Feature Flow (Functional)', () => {
  let testUser;

  beforeAll(async () => {
  console.log('URI:', process.env.MONGO_URI);
  console.log('STATE:', mongoose.connection.readyState);

  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  console.log('CONNECTED');
});

  beforeEach(async () => {
    await User.deleteMany({});
    await RoiCalculation.deleteMany({});

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await RoiCalculation.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('ROI Calculator Flow', () => {
    it('should calculate and save ROI calculation', async () => {
      // User enters: initial investment $1000, final value $1500
      const initialInvestment = 1000;
      const finalValue = 1500;
      const profit = finalValue - initialInvestment;
      const roi = (profit / initialInvestment) * 100;

      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: {
          initial: initialInvestment,
          finalValue: finalValue,
        },
        results: {
          roi: (roi.toFixed(2)),
          profit: profit,
        },
      });

      expect(calculation.inputs.initial).toBe(1000);
      expect(calculation.results.roi).toBe('50.00');
    });

    it('should handle multiple ROI calculations for same user', async () => {
      const calculations = [
        {
          inputs: { initial: 1000, finalValue: 1500 },
          results: { roi: 50, profit: 500 },
        },
        {
          inputs: { initial: 5000, finalValue: 6500 },
          results: { roi: 30, profit: 1500 },
        },
        {
          inputs: { initial: 10000, finalValue: 11000 },
          results: { roi: 10, profit: 1000 },
        },
      ];

      for (const calc of calculations) {
        await RoiCalculation.create({
          userId: testUser._id,
          type: 'roi',
          inputs: calc.inputs,
          results: calc.results,
        });
      }

      const saved = await RoiCalculation.find({ userId: testUser._id });
      expect(saved).toHaveLength(3);
    });
  });

  describe('Compound Interest Calculator Flow', () => {
    it('should calculate and save compound interest', async () => {
      // User enters: principal $1000, rate 5%, years 10
      const principal = 1000;
      const rate = 0.05;
      const years = 10;
      const futureValue = principal * Math.pow(1 + rate, years);
      const interestEarned = futureValue - principal;

      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: {
          principal: principal,
          rate: 5,
          years: years,
        },
        results: {
          futureValue: parseFloat(futureValue.toFixed(2)),
          interestEarned: parseFloat(interestEarned.toFixed(2)),
        },
      });

      expect(calculation.type).toBe('compound');
      expect(calculation.inputs.rate).toBe(5);
      expect(calculation.results.futureValue).toBeCloseTo(1628.89, 1);
    });

    it('should store different calculator types in same collection', async () => {
      // Create ROI calculation
      await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      // Create compound calculation
      await RoiCalculation.create({
        userId: testUser._id,
        type: 'compound',
        inputs: { principal: 1000, rate: 5, years: 10 },
        results: { futureValue: 1629, interestEarned: 629 },
      });

      const allCalcs = await RoiCalculation.find({ userId: testUser._id })
  .sort({ createdAt: -1 });
      expect(allCalcs).toHaveLength(2);
      expect(allCalcs[0].type).toBe('compound');
      expect(allCalcs[1].type).toBe('roi');
    });
  });

  describe('Calculation History', () => {
    it('should maintain calculation history and retrieve most recent', async () => {
      const calculations = [];

      for (let i = 0; i < 5; i++) {
        calculations.push(
          await RoiCalculation.create({
            userId: testUser._id,
            type: 'roi',
            inputs: { initial: 1000 + i * 100, finalValue: 1500 + i * 100 },
            results: { roi: 50 + i, profit: 500 },
          })
        );

        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const recent = await RoiCalculation.find({ userId: testUser._id })
        .sort({ createdAt: -1 })
        .limit(3);

      expect(recent).toHaveLength(3);
      expect(recent[0]._id).toEqual(calculations[4]._id);
      expect(recent[1]._id).toEqual(calculations[3]._id);
    });

    it('should limit history retrieval to 20 most recent', async () => {
      // Create 25 calculations
      for (let i = 0; i < 25; i++) {
        await RoiCalculation.create({
          userId: testUser._id,
          type: 'roi',
          inputs: { initial: 1000 + i, finalValue: 1500 + i },
          results: { roi: 50, profit: 500 },
        });
      }

      const recent = await RoiCalculation.find({ userId: testUser._id })
        .sort({ createdAt: -1 })
        .limit(20);

      expect(recent).toHaveLength(20);
    });
  });

  describe('Complex Calculation Scenarios', () => {
    it('should handle realistic investment scenario', async () => {
      // Scenario: User makes 3 sequential investments
      const investments = [
        { initial: 5000, finalValue: 6500, description: 'Stock portfolio' },
        { initial: 10000, finalValue: 11500, description: 'Bonds' },
        { initial: 2000, finalValue: 2400, description: 'Crypto' },
      ];

      for (const investment of investments) {
        const profit = investment.finalValue - investment.initial;
        const roi = (profit / investment.initial) * 100;

        await RoiCalculation.create({
          userId: testUser._id,
          type: 'roi',
          inputs: {
            initial: investment.initial,
            finalValue: investment.finalValue,
            description: investment.description,
          },
          results: {
            roi: parseFloat(roi.toFixed(2)),
            profit: profit,
          },
        });
      }

      const calculations = await RoiCalculation.find({ userId: testUser._id });
      expect(calculations).toHaveLength(3);

      // Calculate aggregate return
      const totalInvested = investments.reduce((sum, i) => sum + i.initial, 0);
      const totalReturn = investments.reduce((sum, i) => sum + (i.finalValue - i.initial), 0);
      const aggregateROI = (totalReturn / totalInvested) * 100;

      expect(aggregateROI).toBeCloseTo(20, 1); // (1500 + 1500 + 400) / (5000 + 10000 + 2000)
    });

    it('should handle negative ROI scenario', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 5000, finalValue: 4500 },
        results: {
          roi: -10,
          profit: -500,
        },
      });

      expect(calculation.results.roi).toBe(-10);
      expect(calculation.results.profit).toBe(-500);
    });

    it('should handle zero profit scenario', async () => {
      const calculation = await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 5000, finalValue: 5000 },
        results: {
          roi: 0,
          profit: 0,
        },
      });

      expect(calculation.results.roi).toBe(0);
      expect(calculation.results.profit).toBe(0);
    });
  });

  describe('User Isolation in Calculations', () => {
    it('should isolate calculations between users', async () => {
      const user2 = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      await RoiCalculation.create({
        userId: user2._id,
        type: 'roi',
        inputs: { initial: 5000, finalValue: 6000 },
        results: { roi: 20, profit: 1000 },
      });

      const user1Calcs = await RoiCalculation.find({ userId: testUser._id });
      const user2Calcs = await RoiCalculation.find({ userId: user2._id });

      expect(user1Calcs).toHaveLength(1);
      expect(user2Calcs).toHaveLength(1);
      expect(user1Calcs[0].results.profit).toBe(500);
      expect(user2Calcs[0].results.profit).toBe(1000);
    });
  });
});
