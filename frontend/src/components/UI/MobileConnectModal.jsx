import React, { useState, useEffect } from 'react';
import { habitApi } from '../../api/habitApi';
import { subscribeToPush, getExistingSubscription } from '../../utils/notificationUtils';

export default function MobileConnectModal({ isOpen, onClose }) {
  const [mobileInfo, setMobileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInfo();
      checkCurrentSubscription();
    }
  }, [isOpen]);

  const loadInfo = async () => {
    try {
      const data = await habitApi.getMobileConnectInfo();
      setMobileInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  const checkCurrentSubscription = async () => {
    const sub = await getExistingSubscription();
    setIsSubscribed(Boolean(sub));
  };

  const handleEnablePush = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const vapidKey = await habitApi.getVapidKey();
      if (!vapidKey) {
        throw new Error('VAPID public key not configured on backend');
      }

      const subscription = await subscribeToPush(vapidKey);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Mobile Phone' : 'Desktop Browser';

      await habitApi.subscribeDevice(subscription, deviceName);
      setIsSubscribed(true);
      setStatusMsg('✅ Device connected securely! You will now receive habit alerts.');
      loadInfo();
    } catch (err) {
      console.error('Subscription error:', err);
      setStatusMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await habitApi.sendTestNotification();
      setStatusMsg(`🚀 ${res.message || 'Test alert sent! Check your device lockscreen.'}`);
    } catch (err) {
      console.error(err);
      setStatusMsg('❌ Failed to dispatch test alert');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">📱</span>
            <span>Connect to Mobile Phone</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-intro">
            Receive encrypted, on-time habit reminders directly on your phone lock screen so you never break your streak!
          </p>

          {/* Status Message */}
          {statusMsg && (
            <div className={`status-banner ${statusMsg.startsWith('❌') ? 'error' : 'success'}`}>
              {statusMsg}
            </div>
          )}

          {/* Connection Options */}
          <div className="connect-tabs">
            {/* OPTION 1: Scan & Open on Mobile */}
            <div className="connect-section">
              <h4 className="section-title">Method 1: Open on Phone via Local Wi-Fi (Web Push)</h4>
              <p className="section-desc">
                Scan this QR code with your phone camera or visit this URL on your phone's browser:
              </p>

              {mobileInfo && (
                <div className="qr-container">
                  <img src={mobileInfo.qrCodeDataUrl} alt="Scan QR Code" className="qr-image" />
                  <div className="qr-info">
                    <span className="qr-label">Phone URL:</span>
                    <a href={mobileInfo.mobileUrl} target="_blank" rel="noreferrer" className="mobile-link">
                      {mobileInfo.mobileUrl}
                    </a>
                    <span className="qr-sub">Must be on the same Wi-Fi network</span>
                  </div>
                </div>
              )}

              <div className="action-buttons-row">
                <button 
                  className={`btn-primary ${isSubscribed ? 'connected' : ''}`}
                  onClick={handleEnablePush}
                  disabled={loading}
                >
                  {isSubscribed ? '✓ This Device is Subscribed' : '🔔 Enable Notifications on this Device'}
                </button>

                <button 
                  className="btn-secondary"
                  onClick={handleSendTest}
                  disabled={loading}
                >
                  ⚡ Send Test Alert
                </button>
              </div>
            </div>

            {/* OPTION 2: Instant Background Alerts via ntfy.sh */}
            <div className="connect-section secondary-bg">
              <h4 className="section-title">Method 2: 100% Reliable Background Alerts via ntfy app</h4>
              <p className="section-desc">
                For guaranteed lockscreen alerts even when your browser is completely closed:
              </p>
              <ol className="ntfy-steps">
                <li>Install the free <strong>ntfy</strong> app on your Android or iOS device (Play Store / App Store).</li>
                <li>Tap <strong>+</strong> and subscribe to topic: <code className="topic-pill">{mobileInfo?.ntfyTopic || 'atomic-habits-pranav'}</code></li>
                <li>That's it! Your phone will chime at each habit's scheduled time.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="active-count-badge">
            <span className="dot-live"></span>
            <span>{mobileInfo?.activeSubscriptionsCount || 0} active device(s) connected</span>
          </div>
          <button className="btn-close" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
