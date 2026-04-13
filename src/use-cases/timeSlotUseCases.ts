import TimeSlot, { ITimeSlot } from '../domain/TimeSlot';
import { ValidationError, ConflictError } from '../domain/errors';

interface CreateTimeSlotInput {
  date: string;
  startTime: string;
  endTime: string;
}

export const createTimeSlot = async (input: CreateTimeSlotInput): Promise<ITimeSlot> => {
  const { date, startTime, endTime } = input;

  if (!date || !startTime || !endTime) {
    throw new ValidationError('Date, startTime, and endTime are required');
  }

  const existing = await TimeSlot.findOne({ date: new Date(date), startTime, endTime });
  if (existing) {
    throw new ConflictError('A time slot with the same date, start time, and end time already exists');
  }

  const timeSlot = await TimeSlot.create({
    date: new Date(date),
    startTime,
    endTime
  });

  return timeSlot;
};

export const getAvailableTimeSlots = async (): Promise<ITimeSlot[]> => {
  return TimeSlot.find({ isAvailable: true }).sort({ date: 1, startTime: 1 });
};

export const getAllTimeSlots = async (): Promise<ITimeSlot[]> => {
  return TimeSlot.find().sort({ date: 1, startTime: 1 });
};

export const getTimeSlotById = async (id: string): Promise<ITimeSlot | null> => {
  return TimeSlot.findById(id);
};
