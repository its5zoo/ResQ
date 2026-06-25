import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateTheme, updateFontSize, updatePlan, updateWorkingHours, updateLanguage, updateGoogleCalendarDefaultIntegrated, updateAiVoice, updateVoiceSettings, updateNotifications } from '../controllers/settingsController.js';

const router = express.Router();

router.use(protect);

router.patch('/theme', updateTheme);
router.patch('/font-size', updateFontSize);
router.patch('/plan', updatePlan);
router.patch('/working-hours', updateWorkingHours);
router.patch('/language', updateLanguage);
router.patch('/google-default-integrated', updateGoogleCalendarDefaultIntegrated);
router.patch('/ai-voice', updateAiVoice);
router.patch('/voice-ai', updateVoiceSettings);
router.patch('/notifications', updateNotifications);

export default router;
