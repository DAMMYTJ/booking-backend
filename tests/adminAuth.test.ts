import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireAdmin } from '../src/infrastructure/middleware/adminAuth';
import { AuthRequest } from '../src/infrastructure/middleware/optionalAuth';
import { UnauthorizedError, ForbiddenError } from '../src/domain/errors';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('adminAuth middleware', () => {
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

  test('requireAuth should block when authorization header is missing', () => {
    requireAuth(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  test('requireAuth should block when authorization header is not Bearer', () => {
    req.headers = {
      authorization: 'Token abc123',
    };

    requireAuth(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });

  test('requireAuth should block when token is invalid', () => {
    req.headers = {
      authorization: 'Bearer bad-token',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('bad token');
    });

    requireAuth(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0]?.[0] as Error | undefined;
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err?.message).toBe('Invalid or expired token');
  });

  test('requireAuth should set req.user for valid token', () => {
    req.headers = {
      authorization: 'Bearer good-token',
    };

    (jwt.verify as jest.Mock).mockReturnValue({
      id: 'u1',
      role: 'admin',
    });

    requireAuth(req as AuthRequest, res as Response, next);

    expect(req.user).toEqual({
      id: 'u1',
      role: 'admin',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('requireAdmin should allow admin user', () => {
    req.user = {
      id: '1',
      role: 'admin',
    };

    requireAdmin(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('requireAdmin should block when user is missing', () => {
    req = {
      headers: {},
    };

    requireAdmin(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  test('requireAdmin should block non-admin user', () => {
    req.user = {
      id: '2',
      role: 'user',
    };

    requireAdmin(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);

    const err = next.mock.calls[0]?.[0] as Error | undefined;
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err?.message).toBe('Admin access required');
  });
});