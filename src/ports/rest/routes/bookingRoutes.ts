// Import Express router to define API endpoints
import { Router, Response } from 'express';

// optionalAuth allows both guest and logged-in users
import optionalAuth, { AuthRequest } from '../../../infrastructure/middleware/optionalAuth';

// Import authentication + admin authorization middleware
import { requireAuth, requireAdmin } from '../../../infrastructure/middleware/adminAuth';

// Import booking business logic from use-cases layer
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


/**
 * POST /bookings
 * Creates a booking for guest OR logged-in user
 */
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {

    // Extract booking details from request body
    const { timeSlotId, notes, guestName, guestEmail } = req.body;

    // timeSlotId is required for all bookings
    if (!timeSlotId) {
      res.status(400).json({ error: 'timeSlotId is required' });
      return;
    }

    let booking;

    // If user logged in → create user booking
    if (req.user) {

      booking = await createUserBooking({
        userId: req.user.id,
        timeSlotId,
        notes
      });

    } else {

      // Otherwise create guest booking
      if (!guestName || !guestEmail) {
        res.status(400).json({
          error: 'guestName and guestEmail are required for guest bookings'
        });
        return;
      }

      booking = await createGuestBooking({
        guestName,
        guestEmail,
        timeSlotId,
        notes
      });
    }

    // Return created booking
    res.status(201).json(booking);

  } catch (error: any) {

    // Handle different booking errors
    const message = error.message || 'Failed to create booking';

    const status =
      message.includes('not found') ? 404
      : message.includes('already booked') || message.includes('no longer available') ? 409
      : 400;

    res.status(status).json({ error: message });
  }
});


/**
 * GET /bookings
 * Returns all bookings
 */
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {

    const bookings = await getAllBookings();

    res.json(bookings);

  } catch (error: any) {

    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });

  }
});


/**
 * GET /bookings/my
 * Returns bookings for logged-in user only
 */
router.get('/my', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {

    // If not logged in → reject request
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const bookings = await getUserBookings(req.user.id);

    res.json(bookings);

  } catch (error: any) {

    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });

  }
});


/**
 * GET /bookings/:id
 * Returns single booking by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {

    const booking = await getBookingById(req.params.id as string);

    // If booking not found → return 404
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json(booking);

  } catch (error: any) {

    res.status(500).json({ error: error.message || 'Failed to fetch booking' });

  }
});


/**
 * PATCH /bookings/:id/status
 * ADMIN ONLY ROUTE (YOUR FEATURE)
 *
 * Allows admin to accept or decline a booking
 */
router.patch(
  '/:id/status',

  // Step 1: verify user logged in
  requireAuth,

  // Step 2: verify user is admin
  requireAdmin,

  async (req: AuthRequest, res: Response) => {
    try {

      // Extract status from request body
      const { status } = req.body;

      // Status required
      if (!status) {
        res.status(400).json({
          error: 'status is required (pending, accepted, or declined)'
        });
        return;
      }

      // Update booking status using business logic layer
      const booking = await updateBookingStatus(
        req.params.id as string,
        status
      );

      // Return updated booking
      res.json(booking);

    } catch (error: any) {

      const message = error.message || 'Failed to update booking status';

      const statusCode =
        message.includes('not found') ? 404
        : message.includes('Invalid status') ? 400
        : message.includes('already booked') ? 409
        : 500;

      res.status(statusCode).json({ error: message });

    }
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

    }
  }
);


// Export router
export default router;