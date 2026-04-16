import { Router, Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../../domain/errors';
import {
  createTimeSlot,
  getAvailableTimeSlots,
  getAllTimeSlots
} from '../../../use-cases/timeSlotUseCases';

const router = Router();

// POST /timeslots — create a new time slot
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      throw new ValidationError('date, startTime, and endTime are required');
    }

    const timeSlot = await createTimeSlot({ date, startTime, endTime });
    res.status(201).json(timeSlot);
  } catch (error) {
    next(error);
  }
});

// GET /timeslots — get all time slots
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const timeSlots = await getAllTimeSlots();
    res.json(timeSlots);
  } catch (error) {
    next(error);
  }
});

// GET /timeslots/available — get only available time slots
router.get('/available', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const timeSlots = await getAvailableTimeSlots();
    res.json(timeSlots);
  } catch (error) {
    next(error);
  }
});

export default router;
