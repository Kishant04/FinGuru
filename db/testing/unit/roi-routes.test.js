const roiRoutes = require('../../routes/roi');

const mongoose = require('mongoose');
const express = require('express');
const { getROI, createROI } = require('../../routes/roi');
const RoiCalculation = require('../../models/RoiCalculation');
const User = require('../../models/User');

describe('ROI Routes — Handlers (Unit)', () => {
  let testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
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

  describe('GET /api/roi', () => {
    it('should return empty list for user with no calculations', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getROI(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should return calculations sorted by createdAt descending', async () => {
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

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getROI(mockReq, mockRes);

      const calculations = mockRes.json.mock.calls[0][0];
      expect(calculations).toHaveLength(2);
      expect(calculations[0]._id).toEqual(calc2._id);
      expect(calculations[1]._id).toEqual(calc1._id);
    });

    it('should limit results to 20', async () => {
      // Create 25 calculations
      for (let i = 0; i < 25; i++) {
        await RoiCalculation.create({
          userId: testUser._id,
          type: 'roi',
          inputs: { initial: 1000 + i, finalValue: 1500 + i },
          results: { roi: 50, profit: 500 },
        });
      }

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getROI(mockReq, mockRes);

      const calculations = mockRes.json.mock.calls[0][0];
      expect(calculations).toHaveLength(20);
    });

    it('should return only current user calculations', async () => {
      const otherUser = await User.create({
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
        userId: otherUser._id,
        type: 'roi',
        inputs: { initial: 2000, finalValue: 3000 },
        results: { roi: 50, profit: 1000 },
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getROI(mockReq, mockRes);

      const calculations = mockRes.json.mock.calls[0][0];
      expect(calculations).toHaveLength(1);
      expect(calculations[0].userId).toEqual(testUser._id);
    });
  });

  describe('POST /api/roi', () => {
    it('should save ROI calculation', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          type: 'roi',
          inputs: { initial: 1000, finalValue: 1500 },
          results: { roi: 50, profit: 500 },
        },
      };

      await createROI(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser._id,
          type: 'roi',
          inputs: { initial: 1000, finalValue: 1500 },
          results: { roi: 50, profit: 500 },
        })
      );
    });

    it('should save compound interest calculation', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          type: 'compound',
          inputs: { principal: 1000, rate: 5, years: 10 },
          results: { futureValue: 1629, interestEarned: 629 },
        },
      };

      await createROI(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'compound',
          inputs: { principal: 1000, rate: 5, years: 10 },
        })
      );
    });

    it('should reject invalid type', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          type: 'invalid',
          inputs: { initial: 1000 },
          results: { roi: 50 },
        },
      };

      await createROI(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid calculation data',
      });
    });

    it('should reject missing type', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          inputs: { initial: 1000 },
          results: { roi: 50 },
        },
      };

      await createROI(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid calculation data',
      });
    });

    it('should reject missing inputs', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          type: 'roi',
          results: { roi: 50 },
        },
      };

     await createROI(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid calculation data',
      });
    });

    it('should reject missing results', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          type: 'roi',
          inputs: { initial: 1000 },
        },
      };

      await createROI(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid calculation data',
      });
    });
  });

  describe('Flexible Object Storage', () => {
    it('should store flexible inputs and results objects', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          type: 'roi',
          inputs: {
            initial: 1000,
            finalValue: 1500,
            currency: 'USD',
            customField: 'value',
          },
          results: {
            roi: 50,
            profit: 500,
            annualizedReturn: 5.5,
          },
        },
      };

      await createROI(mockReq, mockRes);

      const saved = mockRes.json.mock.calls[0][0];
      expect(saved.inputs.currency).toBe('USD');
      expect(saved.inputs.customField).toBe('value');
      expect(saved.results.annualizedReturn).toBe(5.5);
    });
  });
});
