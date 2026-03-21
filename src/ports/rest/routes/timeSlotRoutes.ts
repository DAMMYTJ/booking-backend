import { Router, Request, Response } from 'express';
import {
  createTimeSlot,
  getAvailableTimeSlots,
  getAllTimeSlots
} from '../../../use-cases/timeSlotUseCases';

const router = Router();

// POST /timeslots — create a new time slot
router.post('/', async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      res.status(400).json({ error: 'date, startTime, and endTime are required' });
      return;
    }

    const timeSlot = await createTimeSlot({ date, startTime, endTime });
    res.status(201).json(timeSlot);
  } catch (error: any) {
    const message = error.message || 'Failed to create time slot';
    const status = message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: message });
  }
});

// GET /timeslots — get all time slots
router.get('/', async (_req: Request, res: Response) => {
  try {
    const timeSlots = await getAllTimeSlots();
    res.json(timeSlots);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch time slots' });
  }
});

// GET /timeslots/available — get only available time slots
router.get('/available', async (_req: Request, res: Response) => {
  try {
    const timeSlots = await getAvailableTimeSlots();
    res.json(timeSlots);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch available time slots' });
  }
});

export default router;
