import { Router, Response, NextFunction } from 'express';
import optionalAuth, { AuthRequest } from '../../../infrastructure/middleware/optionalAuth';

// Import authentication + admin authorization middleware
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

// Create router instance
const router = Router();

// POST /bookings — create a booking (guest or logged-in user)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    // Extract booking details from request body
    const { timeSlotId, notes, guestName, guestEmail } = req.body;

    // timeSlotId is required for all bookings
    if (!timeSlotId) {
      throw new ValidationError('timeSlotId is required');
    }

    let booking;

    // If user logged in → create user booking
    if (req.user) {
      booking = await createUserBooking({ userId: req.user.id, timeSlotId, notes });
    } else {
      if (!guestName || !guestEmail) {
        throw new ValidationError('guestName and guestEmail are required for guest bookings');
      }
      booking = await createGuestBooking({ guestName, guestEmail, timeSlotId, notes });
    }

    // Return created booking
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

// GET /bookings — list all bookings
router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    const bookings = await getAllBookings();

    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// GET /bookings/my — get bookings for the logged-in user
router.get('/my', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    // If not logged in → reject request
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const bookings = await getUserBookings(req.user.id);

    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// GET /bookings/:id — get a single booking
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    const booking = await getBookingById(req.params.id as string);

    // If booking not found → return 404
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// PATCH /bookings/:id/status — admin accept / decline a booking
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
);


/**
 * PATCH /bookings/:id
 * ADMIN ONLY ROUTE (YOUR FEATURE)
 *
 * Allows admin to edit booking details
 */
router.patch(
  '/:id',

  // Require login
  requireAuth,

  // Require admin role
  requireAdmin,

  async (req: AuthRequest, res: Response) => {
    try {

      const { notes, timeSlotId } = req.body;

      // At least one field must be provided
      if (notes === undefined && !timeSlotId) {
        res.status(400).json({
          error: 'Provide at least one field to update (notes, timeSlotId)'
        });
        return;
      }

      // Call business logic to update booking
      const booking = await editBooking(
        req.params.id as string,
        { notes, timeSlotId }
      );

      res.json(booking);

    } catch (error: any) {

      const message = error.message || 'Failed to edit booking';

      const statusCode =
        message.includes('not found') ? 404
        : message.includes('no longer available') ? 409
        : 500;

      res.status(statusCode).json({ error: message });

// PATCH /bookings/:id — admin edit booking details (notes, timeSlotId)
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
);


// Export router
export default router;