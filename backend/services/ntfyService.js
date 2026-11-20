const https = require('https');

// Helper to ensure HTTP headers are strictly ASCII-safe for Node.js
function toAsciiHeader(str) {
  if (!str) return '';
  return str.replace(/[^\x20-\x7E]/g, '').trim();
}

/**
 * Send instant mobile & PC push notification via ntfy.sh using IPv4
 * Configured with 'default' sound and 'high' priority to use the phone's
 * standard app notification sound (same as other apps) instead of alarm ringtones.
 */
function sendNtfyNotification(topic, { title, message, priority = 'high', tags = 'calendar,white_check_mark', clickUrl }) {
  return new Promise((resolve) => {
    if (!topic) {
      return resolve({ success: false, error: 'No topic provided' });
    }

    const headers = {
      'Title': toAsciiHeader(title) || 'Habit Reminder',
      'Priority': priority, // 'high' ensures heads-up banner & vibration with standard sound
      'Tags': tags || 'calendar,white_check_mark',
      'Sound': 'default' // Tells Android & iOS to use the user's standard system notification sound!
    };

    if (clickUrl) {
      headers['Click'] = clickUrl;
      headers['Actions'] = `action=view, label=Open Habit Tracker, url=${clickUrl}`;
    }

    const req = https.request(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      family: 4, // Force IPv4 to prevent IPv6 unreachable timeouts
      headers,
      timeout: 6000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[NTFY] Notification sent successfully to topic "${topic}" (standard sound)`);
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          console.warn(`[NTFY] Failed sending to topic "${topic}": status ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`[NTFY] Error sending to topic "${topic}":`, err.message);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(message || 'Time to complete your habit! Protect your streak.');
    req.end();
  });
}

module.exports = { sendNtfyNotification };
