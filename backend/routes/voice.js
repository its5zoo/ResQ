import express from 'express';
import { processVoiceCommand, clearVoiceCache, getVoiceUsage } from '../controllers/voiceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { voiceGate } from '../middleware/voiceGate.js';

const router = express.Router();

router.post('/command', protect, voiceGate, processVoiceCommand);
router.post('/clear-cache', protect, clearVoiceCache);
router.get('/usage', protect, getVoiceUsage);

export default router;
