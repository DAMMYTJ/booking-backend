import { Request, Response, NextFunction } from 'express';
import { errorLogger } from './logger';
import { AppError } from '../../domain/errors/AppError';

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  code?: number;
  errors?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  errorLogger(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(404).json({ success: false, error: 'Resource not found' });
    return;
  }

  if (err.code === 11000) {
    res.status(400).json({ success: false, error: 'Duplicate field value entered' });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Token expired' });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
