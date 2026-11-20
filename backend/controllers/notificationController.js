const os = require('os');
const QRCode = require('qrcode');
const Subscription = require('../models/Subscription');
const { sendPushNotification, getVapidPublicKey } = require('../services/pushService');
const { sendNtfyNotification } = require('../services/ntfyService');

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
      title: '🔔 Habit Tracker Alert!',
      body: 'Your mobile phone is connected! You will receive on-time habit reminders. 🚀',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'test-notification',
      data: { url: '/' }
    };

    // 1. Send via WebPush
    sendPushNotification(payload).catch(() => {});

    // 2. Send via NTFY instant mobile channel (IPv4 fast delivery)
    const ntfyTopic = process.env.NTFY_TOPIC || 'atomic-habits-pranav';
    const localIp = getLocalIpAddress();

    const ntfyResult = await sendNtfyNotification(ntfyTopic, {
      title: '🔔 Habit Tracker Connected!',
      message: 'Success! Your phone is now paired with Atomic Habits Tracker. You will receive notifications for uncompleted habits!',
      priority: 'urgent',
      tags: 'tada,bell,fire',
      clickUrl: `http://${localIp}:5173`
    });

    res.status(200).json({
      success: true,
      message: `Test alert sent! Dispatched via NTFY (Topic: ${ntfyTopic}).`,
      ntfyDelivered: ntfyResult.success
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
    const port = 5173;
    const mobileUrl = `http://${ip}:${port}`;
    const ntfyTopic = process.env.NTFY_TOPIC || 'atomic-habits-pranav';
    const ntfyUrl = `https://ntfy.sh/${ntfyTopic}`;

    // Generate QR Code for ntfy (instant zero-friction mobile subscription)
    const ntfyQrCode = await QRCode.toDataURL(ntfyUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#ffffff',
        light: '#161b22'
      }
    });

    // Generate QR Code for Local Wi-Fi Web App
    const localAppQrCode = await QRCode.toDataURL(mobileUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#ffffff',
        light: '#161b22'
      }
    });

    const activeCount = await Subscription.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        localIp: ip,
        mobileUrl,
        ntfyTopic,
        ntfyUrl,
        qrCodeDataUrl: ntfyQrCode,
        localAppQrCode,
        activeSubscriptionsCount: activeCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
