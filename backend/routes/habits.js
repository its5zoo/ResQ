import express from 'express';
import { body, param } from 'express-validator';
import { getHabits, createHabit, completeHabit, deleteHabit } from '../controllers/habitController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getHabits)
  .post(
    [
      body('name').optional().isString().withMessage('Name must be a string'),
      body('title').optional().isString().withMessage('Title must be a string'),
      body('targetDays').optional().isArray().withMessage('Target days must be an array'),
      body('targetDays.*').optional().isString().withMessage('Target days must be strings'),
      validateRequest
    ],
    createHabit
  );

router.patch(
  '/:id/complete',
  [
    param('id').isMongoId().withMessage('Invalid habit ID'),
    validateRequest
  ],
  completeHabit
);

router.route('/:id')
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid habit ID'),
      validateRequest
    ],
    deleteHabit
  );

export default router;
