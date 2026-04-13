import express from 'express';
import dotenv from 'dotenv';
import connectDB from './infrastructure/database';
import bookingRoutes from './ports/rest/routes/bookingRoutes';
import timeSlotRoutes from './ports/rest/routes/timeSlotRoutes';
import errorHandler from './infrastructure/middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Booking Backend API is running' });
});

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
