import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extends Express Request to carry optional user info
export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Optional auth middleware — if a valid JWT is present, attaches user to req.
 * If no token is provided, the request continues as a guest.
 */
const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // g
    // uest — no token
  }

  const token = authHeader.split(' ')[1] as string;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_jwt_secret'
    ) as unknown as { id: string; role: string };
    req.user = decoded;
  } catch {
    // Invalid token — treat as guest
  }

  next();
};

export default optionalAuth;
