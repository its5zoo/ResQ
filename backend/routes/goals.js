import express from 'express';
import { body, param } from 'express-validator';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGoals)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
      body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
      body('keyResults').optional().isArray().withMessage('Key results must be an array'),
      body('keyResults.*.title').optional().notEmpty().withMessage('Key result title cannot be empty'),
      body('keyResults.*.progress').optional().isInt({ min: 0, max: 100 }).withMessage('Key result progress must be between 0 and 100'),
      validateRequest
    ],
    createGoal
  );

router.route('/:id')
  .patch(
    [
      param('id').isMongoId().withMessage('Invalid goal ID'),
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
      body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
      body('keyResults').optional().isArray().withMessage('Key results must be an array'),
      body('keyResults.*.title').optional().notEmpty().withMessage('Key result title cannot be empty'),
      body('keyResults.*.progress').optional().isInt({ min: 0, max: 100 }).withMessage('Key result progress must be between 0 and 100'),
      validateRequest
    ],
    updateGoal
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid goal ID'),
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
      body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
      body('keyResults').optional().isArray().withMessage('Key results must be an array'),
      body('keyResults.*.title').optional().notEmpty().withMessage('Key result title cannot be empty'),
      body('keyResults.*.progress').optional().isInt({ min: 0, max: 100 }).withMessage('Key result progress must be between 0 and 100'),
      validateRequest
    ],
    updateGoal
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid goal ID'),
      validateRequest
    ],
    deleteGoal
  );

export default router;
