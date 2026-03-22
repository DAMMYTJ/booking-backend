import Booking, { IBooking } from '../domain/Booking';
import TimeSlot from '../domain/TimeSlot';

type BookingStatus = 'pending' | 'accepted' | 'declined';

interface GuestBookingInput {
  guestName: string;
  guestEmail: string;
  timeSlotId: string;
  notes?: string;
}

interface UserBookingInput {
  userId: string;
  timeSlotId: string;
  notes?: string;
}

export const createGuestBooking = async (input: GuestBookingInput): Promise<IBooking> => {
  const { guestName, guestEmail, timeSlotId, notes } = input;

  if (!guestName || !guestEmail) {
    throw new Error('Guest name and email are required for guest bookings');
  }

  const timeSlot = await TimeSlot.findById(timeSlotId);
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }
  if (!timeSlot.isAvailable) {
    throw new Error('Time slot is no longer available');
  }

  // Check for existing booking on this time slot
  const existingBooking = await Booking.findOne({
    timeSlotId,
    status: { $ne: 'declined' }
  });
  if (existingBooking) {
    throw new Error('This time slot is already booked');
  }

  // Mark slot as unavailable
  timeSlot.isAvailable = false;
  await timeSlot.save();

  const booking = await Booking.create({
    guestName,
    guestEmail,
    timeSlotId,
    ...(notes ? { notes } : {}),
    status: 'pending'
  });

  return booking;
};

export const createUserBooking = async (input: UserBookingInput): Promise<IBooking> => {
  const { userId, timeSlotId, notes } = input;

  const timeSlot = await TimeSlot.findById(timeSlotId);
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }
  if (!timeSlot.isAvailable) {
    throw new Error('Time slot is no longer available');
  }

  // Check for existing booking on this time slot
  const existingBooking = await Booking.findOne({
    timeSlotId,
    status: { $ne: 'declined' }
  });
  if (existingBooking) {
    throw new Error('This time slot is already booked');
  }

  // Mark slot as unavailable
  timeSlot.isAvailable = false;
  await timeSlot.save();

  const booking = await Booking.create({
    userId,
    timeSlotId,
    ...(notes ? { notes } : {}),
    status: 'pending'
  });

  return booking;
};

export const getAllBookings = async (): Promise<IBooking[]> => {
  return Booking.find().populate('timeSlotId').populate('userId', 'name email');
};

export const getBookingById = async (id: string): Promise<IBooking | null> => {
  return Booking.findById(id).populate('timeSlotId').populate('userId', 'name email');
};

export const getUserBookings = async (userId: string): Promise<IBooking[]> => {
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
  if (!['pending', 'accepted', 'declined'].includes(status)) {
    throw new Error('Invalid status. Must be pending, accepted, or declined');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  // If declining a booking that was previously pending/accepted, free the slot
  if (status === 'declined' && previousStatus !== 'declined') {
    await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { isAvailable: true });
  }

  // If accepting/pending a previously declined booking, lock the slot again
  if (previousStatus === 'declined' && status !== 'declined') {
    const conflicting = await Booking.findOne({
      timeSlotId: booking.timeSlotId,
      _id: { $ne: bookingId },
      status: { $ne: 'declined' }
    });
    if (conflicting) {
      // Revert — slot was taken by another booking
      booking.status = 'declined';
      await booking.save();
      throw new Error('This time slot is already booked by another booking');
    }
    await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { isAvailable: false });
  }

  return booking.populate('timeSlotId');
};

/**
 * Admin: edit booking details (notes, timeSlotId).
 */
export const editBooking = async (
  bookingId: string,
  updates: { notes?: string; timeSlotId?: string }
): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // If changing time slot, validate the new slot
  if (updates.timeSlotId && updates.timeSlotId !== booking.timeSlotId.toString()) {
    const newSlot = await TimeSlot.findById(updates.timeSlotId);
    if (!newSlot) {
      throw new Error('Time slot not found');
    }
    if (!newSlot.isAvailable) {
      throw new Error('Time slot is no longer available');
    }

    // Free the old slot
    await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { isAvailable: true });
    // Lock the new slot
    newSlot.isAvailable = false;
    await newSlot.save();

    booking.timeSlotId = newSlot._id as any;
  }

  if (updates.notes !== undefined) {
    booking.notes = updates.notes;
  }

  await booking.save();
  return booking.populate('timeSlotId');
};
