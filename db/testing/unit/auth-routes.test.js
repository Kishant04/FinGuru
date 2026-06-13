const authRoutes = require('../../routes/auth');

const mongoose = require('mongoose');
const express = require('express');
const { register, login, updateProfile, changePassword } = require('../../routes/auth');
const User = require('../../models/User');
const Budget = require('../../models/Budget');
const RiskProfile = require('../../models/RiskProfile');

describe('Auth Routes — Handlers (Unit)', () => {
  let mockRes, mockReq, app;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
    await RiskProfile.deleteMany({});

    // Create Express app and attach routes for testing
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Budget.deleteMany({});
    await RiskProfile.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user account', async () => {
      mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account created successfully',
          user: expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
          }),
        })
      );

      // Verify user was created in database
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeDefined();
    });

    it('should create budget and risk profile for new user', async () => {
      mockReq = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await register(mockReq, mockRes);

      const user = await User.findOne({ email: 'john@example.com' });
      const budget = await Budget.findOne({ userId: user._id });
      const riskProfile = await RiskProfile.findOne({ userId: user._id });

      expect(budget).toBeDefined();
      expect(riskProfile).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      mockReq = {
        body: {
          name: 'John Doe',
          // missing email and password
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please provide name, email and password',
      });
    });

    it('should reject duplicate email', async () => {
      // Create first user
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      mockReq = {
        body: {
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password456',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'An account with that email already exists',
      });
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

    it('should login with correct credentials', async () => {
      mockReq = {
        body: {
          email: 'john@example.com',
          password: 'password123',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await login(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({
            email: 'john@example.com',
            name: 'John Doe',
          }),
        })
      );
    });

    it('should reject login with missing credentials', async () => {
      mockReq = {
        body: {
          email: 'john@example.com',
          // missing password
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please provide email and password',
      });
    });

    it('should reject login with non-existent email', async () => {
      mockReq = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should reject login with incorrect password', async () => {
      mockReq = {
        body: {
          email: 'john@example.com',
          password: 'wrongpassword',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should not return password in login response', async () => {
      mockReq = {
        body: {
          email: 'john@example.com',
          password: 'password123',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await login(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.user.password).toBeUndefined();
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

    it('should update user name', async () => {
      mockReq = {
        user: testUser,
        body: {
          name: 'Jane Doe',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await updateProfile(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Profile updated successfully',
          user: expect.objectContaining({
            name: 'Jane Doe',
          }),
        })
      );
    });

    it('should update user email', async () => {
      mockReq = {
        user: testUser,
        body: {
          email: 'newemail@example.com',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      await updateProfile(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Profile updated successfully',
          user: expect.objectContaining({
            email: 'newemail@example.com',
          }),
        })
      );
    });

    it('should reject duplicate email', async () => {
      await User.create({
        name: 'Another User',
        email: 'taken@example.com',
        password: 'password123',
      });

      mockReq = {
        user: testUser,
        body: {
          email: 'taken@example.com',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await updateProfile(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'That email is already in use',
      });
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

    it('should update password with correct current password', async () => {
      mockReq = {
        user: testUser,
        body: {
          currentPassword: 'password123',
          newPassword: 'newpassword456',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await changePassword(mockReq, mockRes);

      // Verify password was updated
      const updated = await User.findById(testUser._id);
      expect(updated.password).toBe('newpassword456');
    });

    it('should reject if current password is incorrect', async () => {
      mockReq = {
        user: testUser,
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Current password is incorrect',
      });
    });

    it('should reject if fields are missing', async () => {
      mockReq = {
        user: testUser,
        body: {
          currentPassword: 'password123',
          // missing newPassword
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await changePassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please provide current and new password',
      });
    });
  });
});
