/**
 * subscriptionGate.js
 * 
 * Express middleware that blocks access to premium-only API routes unless the
 * requesting user has an active trial or active paid subscription.
 * 
 * Usage:
 *   import { subscriptionGate } from '../middleware/subscriptionGate.js';
 *   router.post('/premium-route', protect, subscriptionGate, handler);
 */

import User from '../models/User.js';

export async function subscriptionGate(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no user context' });
    }

    // Re-fetch user to get latest subscription state (bypasses stale JWT data)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPremiumActive) {
      // Attach fresh user data and proceed
      req.user = user;
      return next();
    }

    // Determine why the user doesn't have access, for helpful error messages
    let reason = 'no_subscription';
    if (user.trial_claimed && user.trial_end_date && user.trial_end_date <= new Date()) {
      reason = 'trial_expired';
    } else if (user.subscription_status === 'expired' || user.subscription_status === 'cancelled') {
      reason = 'subscription_expired';
    }

    return res.status(403).json({
      blocked: true,
      reason,
      upgradeRequired: true,
      message: 'This feature requires an active subscription or free trial. Upgrade to Premium to continue.',
      trialAvailable: !user.trial_claimed
    });
  } catch (error) {
    console.error('[subscriptionGate] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
