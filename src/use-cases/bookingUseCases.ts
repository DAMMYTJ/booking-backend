// Import Booking model and its TypeScript interface
import Booking, { IBooking } from '../domain/Booking';

// Import TimeSlot model
import TimeSlot from '../domain/TimeSlot';

// Allowed booking status values
type BookingStatus = 'pending' | 'accepted' | 'declined';

// Input type for guest booking
interface GuestBookingInput {
  guestName: string;
  guestEmail: string;
  timeSlotId: string;
  notes?: string;
}

// Input type for logged-in user booking
interface UserBookingInput {
  userId: string;
  timeSlotId: string;
  notes?: string;
}

// Create booking for guest user
export const createGuestBooking = async (input: GuestBookingInput): Promise<IBooking> => {
  // Get values from input object
  const { guestName, guestEmail, timeSlotId, notes } = input;

  // Make sure guest name and email are provided
  if (!guestName || !guestEmail) {
    throw new Error('Guest name and email are required for guest bookings');
  }

  // Find selected time slot in database
  const timeSlot = await TimeSlot.findById(timeSlotId);

  // If time slot does not exist, throw error
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }

  // If time slot is already unavailable, throw error
  if (!timeSlot.isAvailable) {
    throw new Error('Time slot is no longer available');
  }

  // Check whether another booking already exists for this same slot
  const existingBooking = await Booking.findOne({
    timeSlotId,
    status: { $ne: 'declined' } // ignore declined bookings
  });

  // If booking already exists, stop duplicate booking
  if (existingBooking) {
    throw new Error('This time slot is already booked');
  }

  // Mark time slot as unavailable because now it is booked
  timeSlot.isAvailable = false;
  await timeSlot.save();

  // Create new guest booking in database
  const booking = await Booking.create({
    guestName,
    guestEmail,
    timeSlotId,
    ...(notes ? { notes } : {}), // add notes only if provided
    status: 'pending' // default status
  });

  // Return created booking
  return booking;
};

// Create booking for logged-in user
export const createUserBooking = async (input: UserBookingInput): Promise<IBooking> => {
  // Get values from input object
  const { userId, timeSlotId, notes } = input;

  // Find time slot
  const timeSlot = await TimeSlot.findById(timeSlotId);

  // If time slot does not exist
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }

  // If slot already unavailable
  if (!timeSlot.isAvailable) {
    throw new Error('Time slot is no longer available');
  }

  // Check if another active booking already exists for same slot
  const existingBooking = await Booking.findOne({
    timeSlotId,
    status: { $ne: 'declined' }
  });

  // Prevent double booking
  if (existingBooking) {
    throw new Error('This time slot is already booked');
  }

  // Mark slot unavailable
  timeSlot.isAvailable = false;
  await timeSlot.save();

  // Create booking for logged-in user
  const booking = await Booking.create({
    userId,
    timeSlotId,
    ...(notes ? { notes } : {}),
    status: 'pending'
  });

  // Return created booking
  return booking;
};

// Get all bookings from database
export const getAllBookings = async (): Promise<IBooking[]> => {
  // Also populate related timeSlot and user information
  return Booking.find().populate('timeSlotId').populate('userId', 'name email');
};

// Get one booking by booking ID
export const getBookingById = async (id: string): Promise<IBooking | null> => {
  // Also populate related timeSlot and user information
  return Booking.findById(id).populate('timeSlotId').populate('userId', 'name email');
};

// Get bookings only for one logged-in user
export const getUserBookings = async (userId: string): Promise<IBooking[]> => {
  // Find bookings by userId and include time slot details
  return Booking.find({ userId }).populate('timeSlotId');
};

/**
 * Admin: update booking status (accept / decline).
 * When declined, the time slot becomes available again.
 * When accepted, the time slot stays unavailable.
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<IBooking> => {
  // Make sure only valid status values are allowed
  if (!['pending', 'accepted', 'declined'].includes(status)) {
    throw new Error('Invalid status. Must be pending, accepted, or declined');
  }

  // Find booking by ID
  const booking = await Booking.findById(bookingId);

  // If booking not found
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Save old status before changing it
  const previousStatus = booking.status;

  // Update booking status
  booking.status = status;
  await booking.save();

  // If booking is declined now, free the time slot
  if (status === 'declined' && previousStatus !== 'declined') {
    await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { isAvailable: true });
  }

  // If booking was declined before and now changed to accepted/pending
  if (previousStatus === 'declined' && status !== 'declined') {
    // Check whether another booking already took this same slot
    const conflicting = await Booking.findOne({
      timeSlotId: booking.timeSlotId,
      _id: { $ne: bookingId }, // not the same booking
      status: { $ne: 'declined' }
    });

    if (conflicting) {
      // If conflict found, revert status back to declined
      booking.status = 'declined';
      await booking.save();

      // Throw error to prevent double booking
      throw new Error('This time slot is already booked by another booking');
    }

    // If no conflict, make time slot unavailable again
    await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { isAvailable: false });
  }

  // Return updated booking with time slot details
  return booking.populate('timeSlotId');
};

/**
 * Admin: edit booking details (notes, timeSlotId).
 */
export const editBooking = async (
  bookingId: string,
  updates: { notes?: string; timeSlotId?: string }
): Promise<IBooking> => {
  // Find booking by ID
  const booking = await Booking.findById(bookingId);

  // If booking not found
  if (!booking) {
    throw new Error('Booking not found');
  }

  // If admin wants to change time slot and it is different from current slot
  if (updates.timeSlotId && updates.timeSlotId !== booking.timeSlotId.toString()) {
    // Find new slot
    const newSlot = await TimeSlot.findById(updates.timeSlotId);

    // If new slot does not exist
    if (!newSlot) {
      throw new Error('Time slot not found');
    }

    // If new slot already unavailable
    if (!newSlot.isAvailable) {
      throw new Error('Time slot is no longer available');
    }

    // Free old slot
    await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { isAvailable: true });

    // Lock new slot
    newSlot.isAvailable = false;
    await newSlot.save();

    // Update booking with new slot id
    booking.timeSlotId = newSlot._id as any;
  }

  // If notes field is given, update notes
  if (updates.notes !== undefined) {
    booking.notes = updates.notes;
  }

  // Save updated booking
  await booking.save();

  // Return updated booking with populated slot details
  return booking.populate('timeSlotId');
};