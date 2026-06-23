import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { updateTheme, updateFontSize, updatePlan, updateWorkingHours, updateGoogleCalendarDefaultIntegrated } from '../controllers/settingsController.js';

const router = express.Router();

router.use(protect);

router.patch('/theme', updateTheme);
router.patch('/font-size', updateFontSize);
router.patch('/plan', updatePlan);
router.patch('/working-hours', updateWorkingHours);
router.patch('/google-default-integrated', updateGoogleCalendarDefaultIntegrated);

export default router;
