const budgetRoutes = require('../../routes/budget');

const mongoose = require('mongoose');
const express = require('express');
const { getBudget, updateBudget } = require('../../routes/budget');
const Budget = require('../../models/Budget');
const User = require('../../models/User');
  
describe('Budget Routes — Handlers (Unit)', () => {
  let testUser, app;

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

    // Create Express app with middleware
    app = express();
    app.use(express.json());

    // Mock auth middleware to attach user
    app.use((req, res, next) => {
      req.user = testUser;
      next();
    });

    app.use('/api/budget', budgetRoutes);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('GET /api/budget', () => {
    it('should return user budget', async () => {
      const budget = await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
        balance: 2000,
        status: 'Saving well',
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getBudget(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          income: 5000,
          expenses: 3000,
          balance: 2000,
        })
      );
    });

    it('should create budget if missing', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getBudget(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();

      const budget = await Budget.findOne({ userId: testUser._id });
      expect(budget).toBeDefined();
    });
  });

  describe('PUT /api/budget', () => {
    it('should update budget with valid data', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          income: 5000,
          expenses: 3000,
        },
      };

      await updateBudget(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          income: 5000,
          expenses: 3000,
          balance: 2000,
          status: 'Saving well - keep it up!',
        })
      );
    });

    it('should calculate status as Overspending when expenses exceed income', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          income: 3000,
          expenses: 5000,
        },
      };

      await updateBudget(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: -2000,
          status: 'Overspending - consider lowering expenses.',
        })
      );
    });

    it('should reject negative income', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          income: -1000,
          expenses: 3000,
        },
      };

      await updateBudget(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please provide valid income and expenses',
      });
    });

    it('should reject negative expenses', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          income: 5000,
          expenses: -1000,
        },
      };

      await updateBudget(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please provide valid income and expenses',
      });
    });

    it('should reject non-numeric income', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          income: 'not-a-number',
          expenses: 3000,
        },
      };

      await updateBudget(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should convert string numbers to actual numbers', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          income: '5000',
          expenses: '3000',
        },
      };

      await updateBudget(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          income: 5000,
          expenses: 3000,
          balance: 2000,
        })
      );
    });
  });

  describe('Balance Calculation', () => {
    it('should calculate correct balance = income - expenses', async () => {
      const testCases = [
        { income: 5000, expenses: 3000, expectedBalance: 2000 },
        { income: 0, expenses: 0, expectedBalance: 0 },
        { income: 1000, expenses: 2000, expectedBalance: -1000 },
        { income: 10000, expenses: 5000, expectedBalance: 5000 },
      ];

      for (const testCase of testCases) {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const mockReq = {
          user: testUser,
          body: {
            income: testCase.income,
            expenses: testCase.expenses,
          },
        };

        await updateBudget(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.balance).toBe(testCase.expectedBalance);
      }
    });
  });
});
