import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

import bookingRoutes from '../src/ports/rest/routes/bookingRoutes';

import {
  createGuestBooking,
  createUserBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
} from '../src/use-cases/bookingUseCases';

import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../src/domain/errors';

// shared mock state
let mockOptionalUser: any = null;

jest.mock('../src/infrastructure/middleware/optionalAuth', () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    if (mockOptionalUser) {
      req.user = mockOptionalUser;
    }
    next();
  },
}));

jest.mock('../src/infrastructure/middleware/adminAuth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin1', role: 'admin' };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/use-cases/bookingUseCases', () => ({
  createGuestBooking: jest.fn(),
  createUserBooking: jest.fn(),
  getAllBookings: jest.fn(),
  getBookingById: jest.fn(),
  getUserBookings: jest.fn(),
  updateBookingStatus: jest.fn(),
  editBooking: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/bookings', bookingRoutes);

// error handler for tests
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: err.message });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({ error: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  return res.status(500).json({ error: err.message || 'Internal server error' });
});

describe('booking routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOptionalUser = null;
  });

  test('should create guest booking', async () => {
    (createGuestBooking as jest.Mock).mockResolvedValue({
      id: '1',
      guestName: 'Jay',
      guestEmail: 'jay@test.com',
      timeSlotId: 't1',
    });

    const res = await request(app).post('/bookings').send({
      guestName: 'Jay',
      guestEmail: 'jay@test.com',
      timeSlotId: 't1',
    });

    expect(res.status).toBe(201);
    expect(createGuestBooking).toHaveBeenCalledWith({
      guestName: 'Jay',
      guestEmail: 'jay@test.com',
      timeSlotId: 't1',
      notes: undefined,
    });
  });

  test('should fail when timeSlotId missing', async () => {
    const res = await request(app).post('/bookings').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('timeSlotId is required');
  });

  test('should fail when guest info is missing', async () => {
    const res = await request(app).post('/bookings').send({
      timeSlotId: 't1',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('guestName and guestEmail are required for guest bookings');
  });

  test('should create logged-in user booking', async () => {
    mockOptionalUser = { id: 'user1', role: 'user' };

    (createUserBooking as jest.Mock).mockResolvedValue({
      id: '2',
      userId: 'user1',
      timeSlotId: 't2',
    });

    const res = await request(app).post('/bookings').send({
      timeSlotId: 't2',
      notes: 'hello',
    });

    expect(res.status).toBe(201);
    expect(createUserBooking).toHaveBeenCalledWith({
      userId: 'user1',
      timeSlotId: 't2',
      notes: 'hello',
    });
  });

  test('should return all bookings', async () => {
    (getAllBookings as jest.Mock).mockResolvedValue([{ id: '1' }]);

    const res = await request(app).get('/bookings');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1' }]);
  });

  test('should return booking by id', async () => {
    (getBookingById as jest.Mock).mockResolvedValue({ id: '1' });

    const res = await request(app).get('/bookings/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: '1' });
  });

  test('should return 404 if booking missing', async () => {
    (getBookingById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/bookings/99');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Booking not found');
  });

  test('should return my bookings when logged in', async () => {
    mockOptionalUser = { id: 'user1', role: 'user' };

    (getUserBookings as jest.Mock).mockResolvedValue([{ id: '1' }]);

    const res = await request(app).get('/bookings/my');

    expect(res.status).toBe(200);
    expect(getUserBookings).toHaveBeenCalledWith('user1');
    expect(res.body).toEqual([{ id: '1' }]);
  });

  test('should return 401 when not logged in', async () => {
    mockOptionalUser = null;

    const res = await request(app).get('/bookings/my');

    expect(res.status).toBe(401);
  });
});