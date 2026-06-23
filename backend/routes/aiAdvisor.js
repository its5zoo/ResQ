import express from 'express';
import { getAdvisorPrompt } from '../controllers/aiAdvisorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAdvisorPrompt);

export default router;
