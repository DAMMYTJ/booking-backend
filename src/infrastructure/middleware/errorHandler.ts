import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors';

/**
 * Centralized error-handling middleware (Week 9).
 *
 * Must be registered AFTER all routes so Express forwards
 * thrown / next(err) errors here.
 *
 * - AppError (operational) → returns the error's statusCode + message.
 * - Unknown errors        → returns 500 and a generic message;
 *                           the real error is logged server-side.
 */
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Unexpected / programmer error — don't leak details to the client
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

export default errorHandler;
