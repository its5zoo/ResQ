import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { getVapidPublicKey } from '../services/pushService.js';

const router = express.Router();

// GET /api/push/vapid-public-key — returns the VAPID public key to the frontend
router.get('/vapid-public-key', protect, (req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ message: 'Push notifications not configured.' });
  }
  res.json({ publicKey: key });
});

// POST /api/push/subscribe — saves a push subscription for the authenticated user
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription object.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Prevent duplicate subscriptions (match by endpoint)
    const alreadyExists = user.pushSubscriptions?.some(
      s => s.endpoint === subscription.endpoint
    );

    if (!alreadyExists) {
      if (!user.pushSubscriptions) user.pushSubscriptions = [];
      user.pushSubscriptions.push(subscription);
      await user.save();
      console.log(`[Push] Subscribed new device for user ${req.user._id}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Push] Subscribe error:', err);
    res.status(500).json({ message: 'Failed to save subscription.' });
  }
});

// DELETE /api/push/unsubscribe — removes a push subscription
router.delete('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: 'Endpoint required.' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.pushSubscriptions = (user.pushSubscriptions || []).filter(
      s => s.endpoint !== endpoint
    );
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
    res.status(500).json({ message: 'Failed to remove subscription.' });
  }
});

export default router;
