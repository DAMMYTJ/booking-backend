import { Router, Response, NextFunction } from 'express';
import optionalAuth, { AuthRequest } from '../../../infrastructure/middleware/optionalAuth';
import { requireAuth, requireAdmin } from '../../../infrastructure/middleware/adminAuth';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../../domain/errors';
import {
  createGuestBooking,
  createUserBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
  editBooking
} from '../../../use-cases/bookingUseCases';

const router = Router();

router.post('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { timeSlotId, notes, guestName, guestEmail } = req.body;
    if (!timeSlotId) {
      throw new ValidationError('timeSlotId is required');
    }
    let booking;
    if (req.user) {
      booking = await createUserBooking({ userId: req.user.id, timeSlotId, notes });
    } else {
      if (!guestName || !guestEmail) {
        throw new ValidationError('guestName and guestEmail are required for guest bookings');
      }
      booking = await createGuestBooking({ guestName, guestEmail, timeSlotId, notes });
    }
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get('/my', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const bookings = await getUserBookings(req.user.id);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await getBookingById(req.params.id as string);
    if (!booking) {
      throw new NotFoundError('Booking');
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw new ValidationError('status is required (pending, accepted, or declined)');
    }
    const booking = await updateBookingStatus(req.params.id as string, status);
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { notes, timeSlotId } = req.body;
    if (notes === undefined && !timeSlotId) {
      throw new ValidationError('Provide at least one field to update (notes, timeSlotId)');
    }
    const booking = await editBooking(req.params.id as string, { notes, timeSlotId });
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;