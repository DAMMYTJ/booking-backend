import { Router, Response } from 'express';
import optionalAuth, { AuthRequest } from '../../../infrastructure/middleware/optionalAuth';
import {
  createGuestBooking,
  createUserBooking,
  getAllBookings,
  getBookingById,
  getUserBookings
} from '../../../use-cases/bookingUseCases';

const router = Router();

// POST /bookings — create a booking (guest or logged-in user)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { timeSlotId, notes, guestName, guestEmail } = req.body;

    if (!timeSlotId) {
      res.status(400).json({ error: 'timeSlotId is required' });
      return;
    }

    let booking;

    if (req.user) {
      // Logged-in user booking
      booking = await createUserBooking({
        userId: req.user.id,
        timeSlotId,
        notes
      });
    } else {
      // Guest booking
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

    res.status(201).json(booking);
  } catch (error: any) {
    const message = error.message || 'Failed to create booking';
    const status = message.includes('not found') ? 404
      : message.includes('already booked') || message.includes('no longer available') ? 409
      : 400;
    res.status(status).json({ error: message });
  }
});

// GET /bookings — list all bookings
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
});

// GET /bookings/my — get bookings for the logged-in user
router.get('/my', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
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

// GET /bookings/:id — get a single booking
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getBookingById(req.params.id as string);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch booking' });
  }
});

export default router;
