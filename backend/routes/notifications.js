import express from 'express';
import { getNotifications, markAsRead, clearReadNotifications } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications);

router.delete('/clear', clearReadNotifications);

router.patch('/:id/read', markAsRead);
router.put('/:id/read', markAsRead); // Allow PUT as a fallback

export default router;
