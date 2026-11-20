require('dotenv').config();
const https = require('https');
const webpush = require('web-push');
const Subscription = require('../models/Subscription');

// Dedicated IPv4 HTTPS agent to prevent Node 20+ IPv6 ETIMEDOUT on desktop WNS/FCM endpoints
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

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
        // Enforce IPv4 and 5-second timeout for reliable desktop PC notifications
        await webpush.sendNotification(pushConfig, payloadString, {
          timeout: 5000,
          urgency: 'high',
          agent: ipv4Agent
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
