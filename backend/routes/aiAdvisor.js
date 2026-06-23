import express from 'express';
import { getDailySummary, askAdvisor } from '../controllers/aiAdvisorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { voiceGate } from '../middleware/voiceGate.js';

const router = express.Router();

router.use(protect);

router.get('/daily-summary', voiceGate, getDailySummary);
router.post('/ask', voiceGate, askAdvisor);

export default router;
