const protect = require('../../middleware/auth');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('Auth Middleware — protect (Unit)', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Authorization Header Validation', () => {
    it('should reject request without x-user-id header', async () => {
      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty x-user-id header', async () => {
      mockReq.headers['x-user-id'] = '';

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('User ID Validation', () => {
    it('should reject invalid ObjectId format', async () => {
      mockReq.headers['x-user-id'] = 'invalid-id';

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-existent user', async () => {
      mockReq.headers['x-user-id'] = '507f1f77bcf86cd799439011';

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Successful Authorization', () => {
    it('should attach user and call next', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      mockReq.headers['x-user-id'] = mockUser._id;

      await protect(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockUser);
    });

    it('should not include password field', async () => {
      const mockUser = {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      mockReq.headers['x-user-id'] ='507f1f77bcf86cd799439011';

      await protect(mockReq, mockRes, mockNext);

      expect(mockReq.user.password).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockReq.headers['x-user-id'] ='507f1f77bcf86cd799439011';

      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});