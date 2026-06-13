const goalRoutes = require('../../routes/goals');

const mongoose = require('mongoose');
const express = require('express');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../../routes/goals');
const Goal = require('../../models/Goal');
const User = require('../../models/User');

describe('Goal Routes — Handlers (Unit)', () => {
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

  describe('GET /api/goals', () => {
    it('should return empty list for user with no goals', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getGoals(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should return all goals for user sorted by createdAt descending', async () => {
      const goal1 = await Goal.create({
        userId: testUser._id,
        name: 'Goal 1',
        target: 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const goal2 = await Goal.create({
        userId: testUser._id,
        name: 'Goal 2',
        target: 2000,
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = { user: testUser };

      await getGoals(mockReq, mockRes);

      const goals = mockRes.json.mock.calls[0][0];
      expect(goals).toHaveLength(2);
      expect(goals[0]._id).toEqual(goal2._id);
      expect(goals[1]._id).toEqual(goal1._id);
    });
  });

  describe('POST /api/goals', () => {
    it('should create a new goal', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          name: 'Save for vacation',
          target: 5000,
          saved: 500,
        },
      };

      await createGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser._id,
          name: 'Save for vacation',
          target: 5000,
          saved: 500,
        })
      );
    });

    it('should set saved to 0 if not provided', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          name: 'Save for vacation',
          target: 5000,
        },
      };

      await createGoal(mockReq, mockRes);

      const goal = mockRes.json.mock.calls[0][0];
      expect(goal.saved).toBe(0);
    });

    it('should reject missing goal name', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          target: 5000,
        },
      };

      await createGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please provide a valid goal name and target',
      });
    });

    it('should reject missing target', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          name: 'Save for vacation',
        },
      };

      await createGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reject target <= 0', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        body: {
          name: 'Save for vacation',
          target: 0,
        },
      };
      await createGoal(mockReq, mockRes);

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
          name: 'Save for vacation',
          target: '5000',
          saved: '500',
        },
      };

      
      await createGoal(mockReq, mockRes);

      const goal = mockRes.json.mock.calls[0][0];
      expect(goal.target).toBe(5000);
      expect(goal.saved).toBe(500);
    });
  });

  describe('PUT /api/goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
        saved: 500,
      });
    });

    it('should update goal', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        params: { id: goal._id.toString() },
        body: {
          name: 'Save for trip',
          target: 6000,
          saved: 1000,
        },
      };

      await updateGoal(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Save for trip',
          target: 6000,
          saved: 1000,
        })
      );
    });

    it('should reject if goal not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        params: { id: fakeId.toString() },
        body: {
          name: 'Updated Name',
        },
      };

      await updateGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Goal not found',
      });
    });

    it('should not allow updating another user goal', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: otherUser,
        params: { id: goal._id.toString() },
        body: {
          name: 'Hacked Goal',
        },
      };

      await updateGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Goal not found',
      });
    });
  });

  describe('DELETE /api/goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
        saved: 500,
      });
    });

    it('should delete goal', async () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        params: { id: goal._id.toString() },
      };

      await deleteGoal(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Goal deleted successfully',
      });

      // Verify deletion
      const deleted = await Goal.findById(goal._id);
      expect(deleted).toBeNull();
    });

    it('should reject if goal not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: testUser,
        params: { id: fakeId.toString() },
      };

      
      await deleteGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Goal not found',
      });
    });

    it('should not allow deleting another user goal', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockReq = {
        user: otherUser,
        params: { id: goal._id.toString() },
      };

      await deleteGoal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);

      // Verify goal still exists
      const existing = await Goal.findById(goal._id);
      expect(existing).toBeDefined();
    });
  });
});
