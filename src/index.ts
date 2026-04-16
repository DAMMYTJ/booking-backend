import express from 'express';
import dotenv from 'dotenv';
import connectDB from './infrastructure/database';
import authRoutes from './ports/rest/routes/authRoutes';
import bookingRoutes from './ports/rest/routes/bookingRoutes';
import timeSlotRoutes from './ports/rest/routes/timeSlotRoutes';
import errorHandler from './infrastructure/middleware/errorHandler';
import { requestLogger } from './infrastructure/middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Booking Backend API is running' });
});

app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/timeslots', timeSlotRoutes);

// Centralized error handler — must be AFTER all routes
app.use(errorHandler);

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
