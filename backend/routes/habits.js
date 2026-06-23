import express from 'express';
import { getHabits, createHabit, completeHabit, deleteHabit } from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getHabits)
  .post(createHabit);

router.patch('/:id/complete', completeHabit);

router.route('/:id')
  .delete(deleteHabit);

export default router;
