import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import optionalAuth, { AuthRequest } from '../src/infrastructure/middleware/optionalAuth';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('optionalAuth middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  test('should continue as guest when authorization header is missing', () => {
    optionalAuth(req as AuthRequest, res as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('should continue as guest when authorization header is not Bearer', () => {
    req.headers = {
      authorization: 'Token abc123',
    };

    optionalAuth(req as AuthRequest, res as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('should attach user when token is valid', () => {
    req.headers = {
      authorization: 'Bearer valid-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue({
      id: 'u1',
      role: 'admin',
    });

    optionalAuth(req as AuthRequest, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      id: 'u1',
      role: 'admin',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('should continue as guest when token is invalid', () => {
    req.headers = {
      authorization: 'Bearer bad-token',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    optionalAuth(req as AuthRequest, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});