import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './optionalAuth';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors';

/**
 * Required auth middleware — rejects requests without a valid JWT.
 */
export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_jwt_secret'
    ) as unknown as { id: string; role: string };
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

/**
 * Admin role middleware — must be used AFTER requireAuth.
 * Rejects requests from non-admin users.
 */
export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    next(new ForbiddenError('Admin access required'));
    return;
  }
  next();
};
