import express from 'express';
import { processVoiceCommand, clearVoiceCache, getVoiceUsage } from '../controllers/voiceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { voiceGate } from '../middleware/voiceGate.js';
import { getResQModel } from '../config/gemini.js';

const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'Voice API ping test successful.' });
});

router.get('/gemini-test', async (req, res) => {
  try {
    const model = getResQModel();
    const result = await model.generateContent("Say hello as ResQ in one sentence");
    const text = result.response.text().trim();
    res.json({ ok: true, response: text });
  } catch (error) {
    console.error('Gemini test route failed:', error);
    res.status(500).json({ ok: false, error: error.message, stack: error.stack });
  }
});

router.post('/command', protect, voiceGate, processVoiceCommand);
router.post('/clear-cache', protect, clearVoiceCache);
router.get('/usage', protect, getVoiceUsage);

export default router;
