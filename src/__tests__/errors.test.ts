import { AppError } from '../domain/errors/AppError';
import { NotFoundError } from '../domain/errors/NotFoundError';
import { UnauthorizedError } from '../domain/errors/UnauthorizedError';
import { ValidationError } from '../domain/errors/ValidationError';

describe('AppError', () => {
  test('should set status to fail for 4xx errors', () => {
    const err = new AppError('Bad request', 400);
    expect(err.message).toBe('Bad request');
    expect(err.statusCode).toBe(400);
    expect(err.status).toBe('fail');
    expect(err.name).toBe('AppError');
  });

  test('should set status to error for 5xx errors', () => {
    const err = new AppError('Server error', 500);
    expect(err.statusCode).toBe(500);
    expect(err.status).toBe('error');
  });

  test('should be an instance of Error', () => {
    const err = new AppError('test', 400);
    expect(err).toBeInstanceOf(Error);
  });

  test('should set status to fail for 404', () => {
    const err = new AppError('Not found', 404);
    expect(err.status).toBe('fail');
  });

  test('should set status to error for 503', () => {
    const err = new AppError('Internal error', 503);
    expect(err.status).toBe('error');
  });
});

describe('NotFoundError', () => {
  test('should create error with resource name', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.name).toBe('NotFoundError');
  });

  test('should be instance of AppError and Error', () => {
    const err = new NotFoundError('Booking');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  test('should work with different resource names', () => {
    const err = new NotFoundError('TimeSlot');
    expect(err.message).toBe('TimeSlot not found');
  });
});

describe('UnauthorizedError', () => {
  test('should use default message', () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe('Unauthorized access');
    expect(err.statusCode).toBe(401);
    expect(err.status).toBe('fail');
    expect(err.name).toBe('UnauthorizedError');
  });

  test('should use custom message', () => {
    const err = new UnauthorizedError('Invalid token');
    expect(err.message).toBe('Invalid token');
  });

  test('should be instance of AppError and Error', () => {
    const err = new UnauthorizedError();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ValidationError', () => {
  test('should create error with message', () => {
    const err = new ValidationError('Email is required');
    expect(err.message).toBe('Email is required');
    expect(err.statusCode).toBe(400);
    expect(err.status).toBe('fail');
    expect(err.name).toBe('ValidationError');
  });

  test('should be instance of AppError and Error', () => {
    const err = new ValidationError('Invalid input');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  test('should work with different messages', () => {
    const err = new ValidationError('Password too short');
    expect(err.message).toBe('Password too short');
  });
});
