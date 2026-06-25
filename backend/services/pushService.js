import webpush from 'web-push';
import User from '../models/User.js';

// Configure VAPID details
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:resq@resqai.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a native OS push notification to all devices for a given userId.
 * @param {string} userId
 * @param {string} title
 * @param {string} body
 * @param {object} options - optional icon, badge, url
 */
export async function sendPushToUser(userId, title, body, options = {}) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

    // Check if user has webPush notifications enabled
    if (user.notifications && user.notifications.webPush === false) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: options.icon || '/favicon.svg',
      badge: options.badge || '/favicon.svg',
      url: options.url || '/',
      tag: options.tag || 'resq-notification',
      renotify: true,
      requireInteraction: false
    });

    const staleSubs = [];

    for (const subscription of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        console.log(`[PushService] Sent push to ${userId}:`, title);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired/removed — mark for cleanup
          staleSubs.push(JSON.stringify(subscription));
        } else {
          console.error('[PushService] Error sending push:', err.message);
        }
      }
    }

    // Clean up stale subscriptions
    if (staleSubs.length > 0) {
      user.pushSubscriptions = user.pushSubscriptions.filter(
        s => !staleSubs.includes(JSON.stringify(s))
      );
      await user.save();
    }
  } catch (err) {
    console.error('[PushService] sendPushToUser error:', err);
  }
}

/**
 * Returns the VAPID public key for the frontend to use when subscribing.
 */
export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY;
}
