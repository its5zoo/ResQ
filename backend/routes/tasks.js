import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, manualReprioritize } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.post('/reprioritize', manualReprioritize);

router.route('/:id')
  .patch(updateTask)
  .put(updateTask) // Allow PUT as a fallback
  .delete(deleteTask);

export default router;
