const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const User = require('../../models/User');
const Budget = require('../../models/Budget');
const Goal = require('../../models/Goal');
const RiskProfile = require('../../models/RiskProfile');
const RoiCalculation = require('../../models/RoiCalculation');

// Import routes
const authRoutes = require('../../routes/auth');
const budgetRoutes = require('../../routes/budget');
const goalRoutes = require('../../routes/goals');
const riskRoutes = require('../../routes/risk');
const roiRoutes = require('../../routes/roi');
const dashboardRoutes = require('../../routes/dashboard');

// Mock auth middleware for integration tests
const mockAuthMiddleware = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Not authorized - please log in' });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ message: 'Not authorized - invalid user id' });
  }
  // For integration tests, we'll attach the user directly
  req.user = { _id: userId, name: 'Test User', email: 'test@example.com' };
  next();
};

const createApp = () => {
  const app = express();
  app.use(express.json());

  // Attach routes
  app.use('/api/auth', authRoutes);
  app.use('/api/budget', mockAuthMiddleware, budgetRoutes);
  app.use('/api/goals', mockAuthMiddleware, goalRoutes);
  app.use('/api/risk', mockAuthMiddleware, riskRoutes);
  app.use('/api/roi', mockAuthMiddleware, roiRoutes);
  app.use('/api/dashboard', mockAuthMiddleware, dashboardRoutes);

  return app;
};

describe('Auth Endpoints (Integration)', () => {
  let app;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    app = createApp();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
    await RiskProfile.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
    await RiskProfile.deleteMany({});
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Account created successfully');
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify budget and risk profile created
      const budget = await Budget.findOne({ userId: response.body.user.id });
      const risk = await RiskProfile.findOne({ userId: response.body.user.id });
      expect(budget).toBeDefined();
      expect(risk).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password456',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.user).toHaveProperty('email', 'john@example.com');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should return logged-in user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'john@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject without authorization', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('x-user-id', testUser._id.toString())
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('name', 'Jane Doe');
      expect(response.body.user).toHaveProperty('email', 'jane@example.com');
    });
  });

  describe('PUT /api/auth/password', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should update password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('x-user-id', testUser._id.toString())
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('x-user-id', testUser._id.toString())
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('Budget Endpoints (Integration)', () => {
  let app, testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    app = createApp();
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

  afterAll(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
    await mongoose.disconnect();
  });

  describe('GET /api/budget', () => {
    it('should return user budget', async () => {
      await Budget.create({
        userId: testUser._id,
        income: 5000,
        expenses: 3000,
        balance: 2000,
      });

      const response = await request(app)
        .get('/api/budget')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('income', 5000);
      expect(response.body).toHaveProperty('balance', 2000);
    });

    it('should create budget if missing', async () => {
      const response = await request(app)
        .get('/api/budget')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('income', 0);
    });
  });

  describe('PUT /api/budget', () => {
    it('should update budget', async () => {
      const response = await request(app)
        .put('/api/budget')
        .set('x-user-id', testUser._id.toString())
        .send({
          income: 5000,
          expenses: 3000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('income', 5000);
      expect(response.body).toHaveProperty('balance', 2000);
      expect(response.body).toHaveProperty('status', 'Saving well - keep it up!');
    });

    it('should calculate negative balance when overspending', async () => {
      const response = await request(app)
        .put('/api/budget')
        .set('x-user-id', testUser._id.toString())
        .send({
          income: 3000,
          expenses: 5000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance', -2000);
      expect(response.body.status).toContain('Overspending');
    });

    it('should reject negative values', async () => {
      const response = await request(app)
        .put('/api/budget')
        .set('x-user-id', testUser._id.toString())
        .send({
          income: -1000,
          expenses: 3000,
        });

      expect(response.status).toBe(400);
    });
  });
});

describe('Goal Endpoints (Integration)', () => {
  let app, testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    app = createApp();
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

  afterAll(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});
    await mongoose.disconnect();
  });

  describe('GET /api/goals', () => {
    it('should return all user goals', async () => {
      await Goal.create({
        userId: testUser._id,
        name: 'Goal 1',
        target: 5000,
      });

      const response = await request(app)
        .get('/api/goals')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Goal 1');
    });
  });

  describe('POST /api/goals', () => {
    it('should create a new goal', async () => {
      const response = await request(app)
        .post('/api/goals')
        .set('x-user-id', testUser._id.toString())
        .send({
          name: 'Save for vacation',
          target: 5000,
          saved: 500,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Save for vacation');
      expect(response.body).toHaveProperty('target', 5000);
    });

    it('should reject invalid target', async () => {
      const response = await request(app)
        .post('/api/goals')
        .set('x-user-id', testUser._id.toString())
        .send({
          name: 'Invalid Goal',
          target: 0,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });
    });

    it('should update a goal', async () => {
      const response = await request(app)
        .put(`/api/goals/${goal._id}`)
        .set('x-user-id', testUser._id.toString())
        .send({
          name: 'Save for trip',
          saved: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Save for trip');
      expect(response.body).toHaveProperty('saved', 1000);
    });

    it('should reject non-existent goal', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/goals/${fakeId}`)
        .set('x-user-id', testUser._id.toString())
        .send({
          name: 'Updated',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await Goal.create({
        userId: testUser._id,
        name: 'Save for vacation',
        target: 5000,
      });
    });

    it('should delete a goal', async () => {
      const response = await request(app)
        .delete(`/api/goals/${goal._id}`)
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Goal deleted successfully');

      const deleted = await Goal.findById(goal._id);
      expect(deleted).toBeNull();
    });

    it('should reject non-existent goal', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/goals/${fakeId}`)
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(404);
    });
  });
});

describe('Risk Endpoints (Integration)', () => {
  let app, testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    app = createApp();
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

  afterAll(async () => {
    await User.deleteMany({});
    await RiskProfile.deleteMany({});
    await mongoose.disconnect();
  });

  describe('GET /api/risk', () => {
    it('should return risk profile', async () => {
      await RiskProfile.create({
        userId: testUser._id,
        score: 10,
        level: 'Moderate',
      });

      const response = await request(app)
        .get('/api/risk')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('level', 'Moderate');
    });
  });

  describe('PUT /api/risk', () => {
    it('should save risk quiz answers', async () => {
      const response = await request(app)
        .put('/api/risk')
        .set('x-user-id', testUser._id.toString())
        .send({
          answers: [1, 2, 1, 1, 1],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('level', 'Conservative');
      expect(response.body).toHaveProperty('score', 6);
    });

    it('should reject incomplete quiz', async () => {
      const response = await request(app)
        .put('/api/risk')
        .set('x-user-id', testUser._id.toString())
        .send({
          answers: [1, 2, 1],
        });

      expect(response.status).toBe(400);
    });
  });
});

describe('ROI Endpoints (Integration)', () => {
  let app, testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    app = createApp();
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

  afterAll(async () => {
    await User.deleteMany({});
    await RoiCalculation.deleteMany({});
    await mongoose.disconnect();
  });

  describe('GET /api/roi', () => {
    it('should return calculations', async () => {
      await RoiCalculation.create({
        userId: testUser._id,
        type: 'roi',
        inputs: { initial: 1000, finalValue: 1500 },
        results: { roi: 50, profit: 500 },
      });

      const response = await request(app)
        .get('/api/roi')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('type', 'roi');
    });
  });

  describe('POST /api/roi', () => {
    it('should save calculation', async () => {
      const response = await request(app)
        .post('/api/roi')
        .set('x-user-id', testUser._id.toString())
        .send({
          type: 'roi',
          inputs: { initial: 1000, finalValue: 1500 },
          results: { roi: 50, profit: 500 },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('type', 'roi');
    });

    it('should reject invalid calculation', async () => {
      const response = await request(app)
        .post('/api/roi')
        .set('x-user-id', testUser._id.toString())
        .send({
          type: 'invalid',
          inputs: { initial: 1000 },
          results: { roi: 50 },
        });

      expect(response.status).toBe(400);
    });
  });
});

describe('Dashboard Endpoint (Integration)', () => {
  let app, testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    app = createApp();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});
    await Budget.deleteMany({});
    await RiskProfile.deleteMany({});

    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Setup test data
    await Budget.create({ userId: testUser._id, income: 5000, expenses: 3000 });
    await RiskProfile.create({ userId: testUser._id, score: 10, level: 'Moderate' });
    await Goal.create({ userId: testUser._id, name: 'Goal 1', target: 5000, saved: 1000 });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Goal.deleteMany({});
    await Budget.deleteMany({});
    await RiskProfile.deleteMany({});
    await mongoose.disconnect();
  });

  describe('GET /api/dashboard', () => {
    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('goals');
      expect(response.body).toHaveProperty('budget');
      expect(response.body).toHaveProperty('risk');
      expect(response.body).toHaveProperty('totals');
      expect(response.body.totals).toHaveProperty('totalGoals', 1);
      expect(response.body.totals).toHaveProperty('totalSavings', 1000);
    });

    it('should calculate aggregate savings correctly', async () => {
      await Goal.create({ userId: testUser._id, name: 'Goal 2', target: 10000, saved: 2000 });
      await Goal.create({ userId: testUser._id, name: 'Goal 3', target: 5000, saved: 1500 });

      const response = await request(app)
        .get('/api/dashboard')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.totals.totalGoals).toBe(3);
      expect(response.body.totals.totalSavings).toBe(4500);
    });
  });
});
