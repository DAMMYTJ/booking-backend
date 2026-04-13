// Admin authentication and authorization middleware

// Import Express response + middleware next handler types
import { Response, NextFunction } from 'express';

// Import JWT library to verify tokens
import jwt from 'jsonwebtoken';

// Import custom request type that includes req.user
import { AuthRequest } from './optionalAuth';


/**
 * REQUIRED AUTH MIDDLEWARE
 * This middleware checks whether the user is logged in using JWT.
 * If token is missing or invalid → request is rejected.
 */
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  // Read Authorization header from request
  // Example format: Bearer eyJhbGciOiJIUzI1NiIs...
  const authHeader = req.headers.authorization;

  // If header missing OR token not in Bearer format → reject request
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Extract actual token from header
  const token = authHeader.split(' ')[1] as string;

  try {

    // Verify token using secret key
    // If token valid → decoded payload returned
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_jwt_secret'
    ) as unknown as { id: string; role: string };

    // Attach decoded user info to request object
    // Now future middleware/routes can access req.user
    req.user = decoded;

    // Allow request to continue to next middleware/route
    next();

  } catch {

    // If token invalid or expired → reject request
    res.status(401).json({ error: 'Invalid or expired token' });

  }
};


/**
 * ADMIN ROLE MIDDLEWARE
 * This middleware ensures only admin users can access certain routes.
 * Must run AFTER requireAuth middleware.
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  // Check if user exists AND role is admin
  if (!req.user || req.user.role !== 'admin') {

    // If not admin → block access
    res.status(403).json({ error: 'Admin access required' });
    return;

  }

  // If admin → allow request to continue
  next();
};