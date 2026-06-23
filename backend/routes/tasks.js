import express from 'express';
import { body, param } from 'express-validator';
import { getTasks, createTask, updateTask, deleteTask, manualReprioritize } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('urgency').isInt({ min: 1, max: 10 }).withMessage('Urgency must be an integer between 1 and 10'),
      body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
      body('estimatedMinutes').optional().isInt({ min: 0 }).withMessage('Estimated minutes must be a positive integer'),
      body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
      body('category').optional().isString().withMessage('Category must be a string'),
      body('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
      body('subtasks.*.title').optional().notEmpty().withMessage('Subtask title cannot be empty'),
      body('subtasks.*.completed').optional().isBoolean().withMessage('Subtask completed must be a boolean'),
      validateRequest
    ],
    createTask
  );

router.post('/reprioritize', manualReprioritize);

router.route('/:id')
  .patch(
    [
      param('id').isMongoId().withMessage('Invalid task ID'),
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('urgency').optional().isInt({ min: 1, max: 10 }).withMessage('Urgency must be an integer between 1 and 10'),
      body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
      body('estimatedMinutes').optional().isInt({ min: 0 }).withMessage('Estimated minutes must be a positive integer'),
      body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
      body('category').optional().isString().withMessage('Category must be a string'),
      body('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
      body('subtasks.*.title').optional().notEmpty().withMessage('Subtask title cannot be empty'),
      body('subtasks.*.completed').optional().isBoolean().withMessage('Subtask completed must be a boolean'),
      validateRequest
    ],
    updateTask
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid task ID'),
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('urgency').optional().isInt({ min: 1, max: 10 }).withMessage('Urgency must be an integer between 1 and 10'),
      body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
      body('estimatedMinutes').optional().isInt({ min: 0 }).withMessage('Estimated minutes must be a positive integer'),
      body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
      body('category').optional().isString().withMessage('Category must be a string'),
      body('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
      body('subtasks.*.title').optional().notEmpty().withMessage('Subtask title cannot be empty'),
      body('subtasks.*.completed').optional().isBoolean().withMessage('Subtask completed must be a boolean'),
      validateRequest
    ],
    updateTask
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid task ID'),
      validateRequest
    ],
    deleteTask
  );

export default router;
