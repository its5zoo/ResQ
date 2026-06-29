import express from 'express';
import {
  generatePlan,
  getPlans,
  getPlan,
  completeDay,
  pausePlan,
  updateReminderTime,
  updatePlan,
  deletePlan
} from '../controllers/planController.js';

const router = express.Router();

// Generate a new plan
router.post('/generate', generatePlan);

// Get all plans for current user
router.get('/', getPlans);

// Get single plan (full with days)
router.get('/:planId', getPlan);

// Mark a day complete
router.patch('/:planId/days/:dayNumber/complete', completeDay);

// Pause / resume plan
router.patch('/:planId/pause', pausePlan);

// Update daily reminder time
router.patch('/:planId/reminder-time', updateReminderTime);

// Update general plan properties
router.patch('/:planId', updatePlan);

// Delete plan + Google Calendar events
router.delete('/:planId', deletePlan);

export default router;
