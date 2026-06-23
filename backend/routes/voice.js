import express from 'express';
import { handleVoiceCommand } from '../controllers/voiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, handleVoiceCommand);

export default router;
