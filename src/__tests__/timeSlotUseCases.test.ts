import { createTimeSlot, getAvailableTimeSlots, getAllTimeSlots, getTimeSlotById } from '../use-cases/timeSlotUseCases';
import TimeSlot from '../domain/TimeSlot';
import { ValidationError, ConflictError } from '../domain/errors';

jest.mock('../domain/TimeSlot');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTimeSlot', () => {
  test('should throw ValidationError if fields are missing', async () => {
    await expect(createTimeSlot({ date: '', startTime: '', endTime: '' }))
      .rejects.toThrow(ValidationError);
  });

  test('should throw ConflictError if time slot already exists', async () => {
    (TimeSlot.findOne as jest.Mock).mockResolvedValue({ _id: 'slot1' });
    await expect(createTimeSlot({ date: '2026-01-01', startTime: '10:00', endTime: '11:00' }))
      .rejects.toThrow(ConflictError);
  });

  test('should create time slot successfully', async () => {
    (TimeSlot.findOne as jest.Mock).mockResolvedValue(null);
    (TimeSlot.create as jest.Mock).mockResolvedValue({ _id: 'slot1', date: '2026-01-01', startTime: '10:00', endTime: '11:00' });
    const result = await createTimeSlot({ date: '2026-01-01', startTime: '10:00', endTime: '11:00' });
    expect(result).toBeDefined();
    expect(result._id).toBe('slot1');
  });
});

describe('getAvailableTimeSlots', () => {
  test('should return available time slots', async () => {
    (TimeSlot.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'slot1', isAvailable: true }])
    });
    const result = await getAvailableTimeSlots();
    expect(result).toBeDefined();
  });
});

describe('getAllTimeSlots', () => {
  test('should return all time slots', async () => {
    (TimeSlot.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'slot1' }, { _id: 'slot2' }])
    });
    const result = await getAllTimeSlots();
    expect(result).toBeDefined();
  });
});

describe('getTimeSlotById', () => {
  test('should return time slot by id', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue({ _id: 'slot1' });
    const result = await getTimeSlotById('slot1');
    expect(result).toBeDefined();
  });

  test('should return null if not found', async () => {
    (TimeSlot.findById as jest.Mock).mockResolvedValue(null);
    const result = await getTimeSlotById('nonexistent');
    expect(result).toBeNull();
  });
});