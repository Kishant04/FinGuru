const mongoose = require('mongoose');
const User = require('../../models/User');

describe('User Model (Database)', () => {
  beforeAll(async () => {
    // Connect to test database
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('User Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secure123',
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.password).toBe('secure123');
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should require name field', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow('Name is required');
    });

    it('should require email field', async () => {
      const user = new User({
        name: 'Test User',
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require password field', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should trim whitespace from name and email', async () => {
      const user = await User.create({
        name: '  John Doe  ',
        email: '  john@example.com  ',
        password: 'password123',
      });

      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
    });

    it('should convert email to lowercase', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123',
      });

      expect(user.email).toBe('john@example.com');
    });

    it('should enforce email uniqueness', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const user2 = new User({
        name: 'Jane Doe',
        email: 'john@example.com',
        password: 'password456',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      });

      await expect(user.save()).rejects.toThrow('Please use a valid email address');
    });

    it('should enforce minimum password length', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      });

      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('User Queries', () => {
    it('should find a user by email', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
    });

    it('should find a user by ID', async () => {
      const created = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const user = await User.findById(created._id);
      expect(user).toBeDefined();
      expect(user.email).toBe('john@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await User.findOne({ email: 'nonexistent@example.com' });
      expect(user).toBeNull();
    });
  });

  describe('User Updates', () => {
    it('should update user name', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      user.name = 'Jane Doe';
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.name).toBe('Jane Doe');
    });

    it('should update user password', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      user.password = 'newpassword456';
      await user.save();

      const updated = await User.findById(user._id);
      expect(updated.password).toBe('newpassword456');
    });
  });
});
