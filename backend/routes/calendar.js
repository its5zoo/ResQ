import express from 'express';
import { body, param } from 'express-validator';
import { getEvents, createEvent, updateEvent, deleteEvent, autoSchedule } from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.post('/auto-schedule', autoSchedule);

router.route('/')
  .get(getEvents)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('startTime').isISO8601().withMessage('Start time must be a valid date'),
      body('endTime').isISO8601().withMessage('End time must be a valid date'),
      body('type').isIn(['ai_block', 'user_block', 'deadline', 'study', 'meeting']).withMessage('Invalid event type'),
      body('taskId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Task ID must be a valid mongo ID'),
      body('layer').optional().isString().withMessage('Layer must be a string'),
      body('notes').optional().isString().withMessage('Notes must be a string'),
      body('aiGenerated').optional().isBoolean().withMessage('aiGenerated must be a boolean'),
      validateRequest
    ],
    createEvent
  );

router.route('/:id')
  .patch(
    [
      param('id').isMongoId().withMessage('Invalid event ID'),
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('startTime').optional().isISO8601().withMessage('Start time must be a valid date'),
      body('endTime').optional().isISO8601().withMessage('End time must be a valid date'),
      body('type').optional().isIn(['ai_block', 'user_block', 'deadline', 'study', 'meeting']).withMessage('Invalid event type'),
      body('taskId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Task ID must be a valid mongo ID'),
      body('layer').optional().isString().withMessage('Layer must be a string'),
      body('notes').optional().isString().withMessage('Notes must be a string'),
      body('aiGenerated').optional().isBoolean().withMessage('aiGenerated must be a boolean'),
      validateRequest
    ],
    updateEvent
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid event ID'),
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('startTime').optional().isISO8601().withMessage('Start time must be a valid date'),
      body('endTime').optional().isISO8601().withMessage('End time must be a valid date'),
      body('type').optional().isIn(['ai_block', 'user_block', 'deadline', 'study', 'meeting']).withMessage('Invalid event type'),
      body('taskId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Task ID must be a valid mongo ID'),
      body('layer').optional().isString().withMessage('Layer must be a string'),
      body('notes').optional().isString().withMessage('Notes must be a string'),
      body('aiGenerated').optional().isBoolean().withMessage('aiGenerated must be a boolean'),
      validateRequest
    ],
    updateEvent
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid event ID'),
      validateRequest
    ],
    deleteEvent
  );

export default router;
