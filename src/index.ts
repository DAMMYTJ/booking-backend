import express from 'express';
import dotenv from 'dotenv';
import connectDB from './infrastructure/database';
import bookingRoutes from './ports/rest/routes/bookingRoutes';
import timeSlotRoutes from './ports/rest/routes/timeSlotRoutes';
import authRoutes from './ports/rest/routes/authRoutes';
import { requestLogger } from './infrastructure/middleware/logger';
import { errorHandler } from './infrastructure/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

app.get('/', (req, res) => {
  res.json({ message: 'Booking Backend API is running' });
});

app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/timeslots', timeSlotRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
