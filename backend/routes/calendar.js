import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent, autoSchedule } from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/auto-schedule', autoSchedule);

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/:id')
  .patch(updateEvent)
  .put(updateEvent)
  .delete(deleteEvent);

export default router;
