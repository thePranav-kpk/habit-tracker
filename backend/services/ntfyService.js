const https = require('https');

// Helper to ensure HTTP headers are strictly ASCII-safe for Node.js
function toAsciiHeader(str) {
  if (!str) return '';
  return str.replace(/[^\x20-\x7E]/g, '').trim();
}

/**
 * Send instant mobile push notification via ntfy.sh using IPv4
 */
function sendNtfyNotification(topic, { title, message, priority = 'urgent', tags = 'alarm_clock,fire', clickUrl }) {
  return new Promise((resolve) => {
    if (!topic) {
      return resolve({ success: false, error: 'No topic provided' });
    }

    const headers = {
      'Title': toAsciiHeader(title) || 'Habit Reminder',
      'Priority': priority,
      'Tags': tags || 'alarm_clock,fire'
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
          console.log(`[NTFY] Notification sent successfully to topic "${topic}"`);
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
