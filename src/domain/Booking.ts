import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  userId?: Types.ObjectId;       // optional — null for guest bookings
  guestName?: string;            // required if guest
  guestEmail?: string;           // required if guest
  timeSlotId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  notes?: string;
  createdAt: Date;
}

const BookingSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  guestName: { type: String, default: null },
  guestEmail: { type: String, default: null },
  timeSlotId: { type: Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
