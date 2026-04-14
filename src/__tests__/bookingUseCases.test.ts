import { createGuestBooking, createUserBooking, getAllBookings, getBookingById, getUserBookings, updateBookingStatus, editBooking } from '../use-cases/bookingUseCases';
import Booking from '../domain/Booking';
import TimeSlot from '../domain/TimeSlot';
import { ValidationError, NotFoundError, ConflictError } from '../domain/errors';

jest.mock('../domain/Booking');
jest.mock('../domain/TimeSlot');

const mockTimeSlot = {
  _id: 'slot1',
  isAvailable: true,
  save: jest.fn(),
};

const mockBooking = {
  _id: 'booking1',
  status: 'pending',
  timeSlotId: 'slot1',
  notes: 'test note',
  save: jest.fn(),
  populate: jest.fn().mockResolvedValue({ _id: 'booking1', status: 'pending' }),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createGuestBooking', () => {
  test('should throw ValidationError if guestName or guestEmail missing', async () => {
    await expect(createGuestBooking({ guestName: '', guestEmail: '', timeSlotId: 'slot1' }))
      .rejects.toThrow(ValidationError);
  });

  test('should throw NotFoundError if time slot not found', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue(null);
    await expect(createGuestBooking({ guestName: 'John', guestEmail: 'john@test.com', timeSlotId: 'slot1' }))
      .rejects.toThrow(NotFoundError);
  });

  test('should throw ConflictError if time slot not available', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ ...mockTimeSlot, isAvailable: false });
    await expect(createGuestBooking({ guestName: 'John', guestEmail: 'john@test.com', timeSlotId: 'slot1' }))
      .rejects.toThrow(ConflictError);
  });

  test('should throw ConflictError if slot already booked', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ ...mockTimeSlot, isAvailable: true });
    (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);
    await expect(createGuestBooking({ guestName: 'John', guestEmail: 'john@test.com', timeSlotId: 'slot1' }))
      .rejects.toThrow(ConflictError);
  });

  test('should create guest booking successfully', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ ...mockTimeSlot, save: jest.fn() });
    (Booking.findOne as jest.Mock).mockResolvedValue(null);
    (Booking.create as jest.Mock).mockResolvedValue(mockBooking);
    const result = await createGuestBooking({ guestName: 'John', guestEmail: 'john@test.com', timeSlotId: 'slot1' });
    expect(result).toBeDefined();
  });
});

describe('createUserBooking', () => {
  test('should throw NotFoundError if time slot not found', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue(null);
    await expect(createUserBooking({ userId: 'user1', timeSlotId: 'slot1' }))
      .rejects.toThrow(NotFoundError);
  });

  test('should throw ConflictError if slot not available', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ ...mockTimeSlot, isAvailable: false });
    await expect(createUserBooking({ userId: 'user1', timeSlotId: 'slot1' }))
      .rejects.toThrow(ConflictError);
  });

  test('should throw ConflictError if slot already booked', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ ...mockTimeSlot, isAvailable: true });
    (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);
    await expect(createUserBooking({ userId: 'user1', timeSlotId: 'slot1' }))
      .rejects.toThrow(ConflictError);
  });

  test('should create user booking successfully', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ ...mockTimeSlot, save: jest.fn() });
    (Booking.findOne as jest.Mock).mockResolvedValue(null);
    (Booking.create as jest.Mock).mockResolvedValue(mockBooking);
    const result = await createUserBooking({ userId: 'user1', timeSlotId: 'slot1' });
    expect(result).toBeDefined();
  });
});

describe('getAllBookings', () => {
  test('should return all bookings', async () => {
    (Booking.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockBooking])
      })
    });
    const result = await getAllBookings();
    expect(result).toBeDefined();
  });
});

describe('getBookingById', () => {
  test('should return booking by id', async () => {
    (Booking.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking)
      })
    });
    const result = await getBookingById('booking1');
    expect(result).toBeDefined();
  });
});

describe('getUserBookings', () => {
  test('should return user bookings', async () => {
    (Booking.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue([mockBooking])
    });
    const result = await getUserBookings('user1');
    expect(result).toBeDefined();
  });
});

describe('updateBookingStatus', () => {
  test('should throw ValidationError for invalid status', async () => {
    await expect(updateBookingStatus('booking1', 'invalid' as any))
      .rejects.toThrow(ValidationError);
  });

  test('should throw NotFoundError if booking not found', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(null);
    await expect(updateBookingStatus('booking1', 'accepted'))
      .rejects.toThrow(NotFoundError);
  });

  test('should update booking status to declined and free slot', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'pending', save: jest.fn(), populate: jest.fn().mockResolvedValue(mockBooking) });
    (TimeSlot.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    const result = await updateBookingStatus('booking1', 'declined');
    expect(result).toBeDefined();
  });

  test('should update booking status to accepted', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'pending', save: jest.fn(), populate: jest.fn().mockResolvedValue(mockBooking) });
    const result = await updateBookingStatus('booking1', 'accepted');
    expect(result).toBeDefined();
  });
});

describe('editBooking', () => {
  test('should throw NotFoundError if booking not found', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue(null);
    await expect(editBooking('booking1', { notes: 'test' }))
      .rejects.toThrow(NotFoundError);
  });

  test('should update notes successfully', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue({ ...mockBooking, save: jest.fn(), populate: jest.fn().mockResolvedValue(mockBooking) });
    const result = await editBooking('booking1', { notes: 'updated note' });
    expect(result).toBeDefined();
  });

  test('should throw NotFoundError if new time slot not found', async () => {
    (Booking.findById as jest.Mock).mockResolvedValue({ ...mockBooking, save: jest.fn(), populate: jest.fn().mockResolvedValue(mockBooking) });
    (TimeSlot.findById as jest.Mock).mockResolvedValue(null);
    await expect(editBooking('booking1', { timeSlotId: 'newSlot' }))
      .rejects.toThrow(NotFoundError);
  });
});