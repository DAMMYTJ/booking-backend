import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/AppError';
import { errorLogger } from './logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  errorLogger(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err.message
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      status: 'fail',
      error: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      status: 'fail',
      error: 'Token expired'
    });
    return;
  }

  res.status(500).json({
    success: false,
    status: 'error',
    error: 'Internal server error'
  });
};
