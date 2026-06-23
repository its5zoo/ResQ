import express from 'express';
import { processVoiceCommand } from '../controllers/voiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/command', protect, processVoiceCommand);

export default router;
