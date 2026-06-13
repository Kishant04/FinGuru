const riskRoutes = require('../../routes/risk');
const User = require('../../models/User');
const mongoose = require('mongoose');
const express = require('express');
const { getRisk, updateRisk } = require('../../routes/risk');
const RiskProfile = require('../../models/RiskProfile');
  
describe('Risk Routes — Handlers (Unit)', () => {
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

  describe('calculateRiskLevel', () => {
    it('should calculate Conservative for score <= 7', () => {
      const testCases = [0, 1, 5, 7];

      for (const score of testCases) {
        // Score = answers.reduce, so score 1-3 per question, max 15
        const risk = score <= 7 ? 'Conservative' : score <= 11 ? 'Moderate' : 'Aggressive';
        expect(risk).toBe('Conservative');
      }
    });

    it('should calculate Moderate for score 8-11', () => {
      const testCases = [8, 9, 10, 11];

      for (const score of testCases) {
        const risk = score <= 7 ? 'Conservative' : score <= 11 ? 'Moderate' : 'Aggressive';
        expect(risk).toBe('Moderate');
      }
    });

    it('should calculate Aggressive for score > 11', () => {
      const testCases = [12, 13, 14, 15];

      for (const score of testCases) {
        const risk = score <= 7 ? 'Conservative' : score <= 11 ? 'Moderate' : 'Aggressive';
        expect(risk).toBe('Aggressive');
      }
    });
  });

  describe('GET /api/risk', () => {
    it('should return user risk profile', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 10,
        level: 'Moderate',
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getRisk(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 10,
          level: 'Moderate',
        })
      );
    });

    it('should create default profile if missing', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

    
      await getRisk(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser._id,
          level: 'Moderate',
        })
      );
    });
  });

  describe('PUT /api/risk', () => {
    it('should submit risk quiz answers and calculate level', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: [1, 2, 1, 1, 1], // sum = 6, should be Conservative
        },
      };

      await updateRisk(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 6,
          level: 'Conservative',
        })
      );
    });

    it('should calculate Moderate for mid-range score', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: [2, 2, 2, 2, 2], // sum = 10, should be Moderate
        },
      };

      await updateRisk(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 10,
          level: 'Moderate',
        })
      );
    });

    it('should calculate Aggressive for high score', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: [3, 3, 3, 3, 3], // sum = 15, should be Aggressive
        },
      };

      await updateRisk(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 15,
          level: 'Aggressive',
        })
      );
    });

    it('should reject missing answers', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {},
      };

      await updateRisk(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please answer all 5 quiz questions',
      });
    });

    it('should reject non-array answers', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: '1,2,3,4,5',
        },
      };

      
      await updateRisk(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please answer all 5 quiz questions',
      });
    });

    it('should reject answers with wrong length', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: [1, 2, 3, 4], // only 4 answers
        },
      };

      
      await updateRisk(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please answer all 5 quiz questions',
      });
    });

    it('should reject answers with falsy values', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: [1, 2, 0, 1, 1], // 0 is falsy
        },
      };

      await updateRisk(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should update existing profile', async () => {
      const profile = await RiskProfile.create({
        userId: testUser._id,
        score: 6,
        level: 'Conservative',
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          answers: [3, 3, 3, 3, 3], // now Aggressive
        },
      };

      await updateRisk(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: profile._id,
          score: 15,
          level: 'Aggressive',
        })
      );
    });
  });

  describe('Score Boundary Testing', () => {
    it('should handle boundary score 7 -> 8', async () => {
      // Test score 7 (last Conservative)
      let mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      let mockReq = {
        user: testUser,
        body: {
          answers: [1, 1, 1, 2, 2], // sum = 7
        },
      };

      await updateRisk(mockReq, mockRes);

      let response = mockRes.json.mock.calls[0][0];
      expect(response.level).toBe('Conservative');

      // Clear for next test
      await RiskProfile.deleteMany({ userId: testUser._id });

      // Test score 8 (first Moderate)
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockReq = {
        user: testUser,
        body: {
          answers: [1, 2, 1, 2, 2], // sum = 8
        },
      };

      await updateRisk(mockReq, mockRes);

      response = mockRes.json.mock.calls[0][0];
      expect(response.level).toBe('Moderate');
    });
  });
});
