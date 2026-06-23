import express from 'express';
import { registerUser, authUser, getUserProfile, updateUserSettings } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/settings', protect, updateUserSettings);

export default router;
