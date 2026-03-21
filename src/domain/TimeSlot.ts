import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeSlot extends Document {
  date: Date;
  startTime: string;   // e.g. "09:00"
  endTime: string;      // e.g. "10:00"
  isAvailable: boolean;
  createdAt: Date;
}

const TimeSlotSchema: Schema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate time slots on the same date
TimeSlotSchema.index({ date: 1, startTime: 1, endTime: 1 }, { unique: true });

export default mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema);
