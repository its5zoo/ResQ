import express from 'express';
import { getDailySummary, askAdvisor } from '../controllers/aiAdvisorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/daily-summary', getDailySummary);
router.post('/ask', askAdvisor);

export default router;
