import Booking, { IBooking } from '../domain/Booking';
import TimeSlot from '../domain/TimeSlot';

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
