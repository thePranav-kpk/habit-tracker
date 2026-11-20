require('dotenv').config();
const webpush = require('web-push');
const Subscription = require('../models/Subscription');

// VAPID keys setup
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@atomic-habits.local';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    console.log('[WebPush] VAPID keys initialized successfully');
  } catch (err) {
    console.warn('[WebPush] VAPID init warning:', err.message);
  }
}

/**
 * Send push notification to all subscribed devices
 */
async function sendPushNotification(payload) {
  try {
    const subscriptions = await Subscription.find();
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[WebPush] No active device subscriptions found');
      return { sent: 0, total: 0 };
    }

    const payloadString = JSON.stringify(payload);
    let sentCount = 0;

    const promises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };

      try {
        // Use 4-second timeout so network blocks or dead endpoints don't hang
        await webpush.sendNotification(pushConfig, payloadString, {
          timeout: 4000,
          urgency: 'high'
        });
        sentCount++;
      } catch (err) {
        console.warn(`[WebPush] Failed sending to ${sub.deviceName}: ${err.statusCode || err.code || err.message}`);
        // If expired or invalid (404 or 410 Gone), remove from database
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[WebPush] Removing expired subscription for ${sub.deviceName}`);
          await Subscription.deleteOne({ _id: sub._id });
        }
      }
    });

    await Promise.all(promises);
    return { sent: sentCount, total: subscriptions.length };
  } catch (err) {
    console.error('[WebPush] sendPushNotification error:', err.message);
    return { sent: 0, total: 0 };
  }
}

module.exports = {
  sendPushNotification,
  getVapidPublicKey: () => vapidPublicKey
};
