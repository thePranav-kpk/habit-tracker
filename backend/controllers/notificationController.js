const os = require('os');
const QRCode = require('qrcode');
const Subscription = require('../models/Subscription');
const { sendPushNotification, getVapidPublicKey } = require('../services/pushService');

// Get local network IPv4 address for mobile access
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (127.0.0.1) and non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// @desc    Get VAPID Public Key for Web Push
// @route   GET /api/notifications/vapid-key
exports.getVapidKey = (req, res) => {
  const publicKey = getVapidPublicKey();
  res.status(200).json({ success: true, publicKey });
};

// @desc    Save/Register push subscription from mobile/browser
// @route   POST /api/notifications/subscribe
exports.subscribe = async (req, res) => {
  try {
    const { subscription, deviceName } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, error: 'Invalid subscription object' });
    }

    const doc = await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        deviceName: deviceName || 'Mobile Device'
      },
      { upsert: true, new: true }
    );

    console.log(`[Subscription] Device registered: ${doc.deviceName}`);
    res.status(201).json({ success: true, message: 'Subscribed successfully', data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Unsubscribe device
// @route   POST /api/notifications/unsubscribe
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'Endpoint required' });
    }

    await Subscription.deleteOne({ endpoint });
    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Send instant test notification to connected devices
// @route   POST /api/notifications/test
exports.sendTest = async (req, res) => {
  try {
    const payload = {
      title: '🔔 Phone Connected Successfully!',
      body: 'Your mobile phone is now securely paired. You will receive habit reminders on time! 🚀',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'test-notification',
      data: { url: '/' }
    };

    const result = await sendPushNotification(payload);

    // Also send test to ntfy if configured
    const ntfyTopic = process.env.NTFY_TOPIC;
    if (ntfyTopic) {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: 'POST',
          headers: {
            'Title': '🔔 Habit Tracker Connected!',
            'Priority': 'default',
            'Tags': 'tada,bell'
          },
          body: 'Your phone is successfully paired with Atomic Habits Tracker!'
        });
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: `Test notification dispatched to ${result.sent} of ${result.total} registered devices.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get QR Code and Mobile connection details
// @route   GET /api/notifications/mobile-info
exports.getMobileInfo = async (req, res) => {
  try {
    const ip = getLocalIpAddress();
    const port = 5173; // Frontend Vite port
    const mobileUrl = `http://${ip}:${port}`;
    const qrCodeDataUrl = await QRCode.toDataURL(mobileUrl, {
      margin: 1,
      width: 200,
      color: {
        dark: '#ffffff',
        light: '#161b22'
      }
    });

    const activeCount = await Subscription.countDocuments();
    const ntfyTopic = process.env.NTFY_TOPIC || 'atomic-habits-pranav';

    res.status(200).json({
      success: true,
      data: {
        localIp: ip,
        mobileUrl,
        qrCodeDataUrl,
        activeSubscriptionsCount: activeCount,
        ntfyTopic
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
