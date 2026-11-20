import React, { useState, useEffect } from 'react';
import { habitApi } from '../../api/habitApi';
import { subscribeToPush, getExistingSubscription } from '../../utils/notificationUtils';

export default function MobileConnectModal({ isOpen, onClose }) {
  const [mobileInfo, setMobileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('instant'); // 'instant' | 'browser'

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

  const handleSendTest = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await habitApi.sendTestNotification();
      setStatusMsg(`🚀 ${res.message || 'Test alert dispatched! Check your phone lockscreen now.'}`);
    } catch (err) {
      console.error(err);
      setStatusMsg('❌ Failed to dispatch test alert');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBrowserPush = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const vapidKey = await habitApi.getVapidKey();
      if (!vapidKey) {
        throw new Error('VAPID public key not configured on backend');
      }

      const subscription = await subscribeToPush(vapidKey);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Mobile Phone Browser' : 'Desktop Browser';

      await habitApi.subscribeDevice(subscription, deviceName);
      setIsSubscribed(true);
      setStatusMsg('✅ Browser notifications enabled on this device!');
      loadInfo();
    } catch (err) {
      console.error('Subscription error:', err);
      setStatusMsg(`❌ ${err.message}`);
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
            Receive on-time reminders directly on your phone lockscreen <strong>only for uncompleted habits</strong>!
          </p>

          {/* Status Message */}
          {statusMsg && (
            <div className={`status-banner ${statusMsg.startsWith('❌') ? 'error' : 'success'}`}>
              {statusMsg}
            </div>
          )}

          {/* Method Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <button
              className={`quick-pill ${activeTab === 'instant' ? 'active' : ''}`}
              style={{
                background: activeTab === 'instant' ? 'var(--accent)' : 'var(--bg-card)',
                color: '#ffffff',
                fontWeight: '600'
              }}
              onClick={() => setActiveTab('instant')}
            >
              ⚡ Method 1: Instant Phone Connect (Recommended)
            </button>
            <button
              className={`quick-pill ${activeTab === 'browser' ? 'active' : ''}`}
              style={{
                background: activeTab === 'browser' ? 'var(--accent)' : 'var(--bg-card)',
                color: '#ffffff',
                fontWeight: '600'
              }}
              onClick={() => setActiveTab('browser')}
            >
              🌐 Method 2: Wi-Fi Browser
            </button>
          </div>

          {activeTab === 'instant' ? (
            <div className="connect-section" style={{ border: '1px solid var(--accent)' }}>
              <h4 className="section-title">Scan to Connect Phone in 10 Seconds</h4>
              <p className="section-desc">
                Works on <strong>Android & iPhone</strong>. Rings your phone lockscreen at habit times even with phone asleep:
              </p>

              {mobileInfo && (
                <div className="qr-container">
                  <img src={mobileInfo.qrCodeDataUrl} alt="Scan QR Code" className="qr-image" />
                  <div className="qr-info">
                    <span className="qr-label">1. Scan or open in phone browser:</span>
                    <a href={mobileInfo.ntfyUrl} target="_blank" rel="noreferrer" className="mobile-link">
                      {mobileInfo.ntfyUrl}
                    </a>
                    <span className="qr-sub">2. Tap <strong>"Subscribe"</strong> (or open in free ntfy app)</span>
                    <span className="qr-sub">3. Then click the test button below!</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '8px' }}>
                <button 
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '13.5px' }}
                  onClick={handleSendTest}
                  disabled={loading}
                >
                  ⚡ Send Test Notification to My Phone
                </button>
              </div>
            </div>
          ) : (
            <div className="connect-section">
              <h4 className="section-title">Method 2: Open Web App via Local Wi-Fi</h4>
              <p className="section-desc">
                Open this app directly on your phone's browser over the local network:
              </p>

              {mobileInfo && (
                <div className="qr-container">
                  <img src={mobileInfo.localAppQrCode} alt="Local App QR" className="qr-image" />
                  <div className="qr-info">
                    <span className="qr-label">Local Wi-Fi Address:</span>
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
                  onClick={handleEnableBrowserPush}
                  disabled={loading}
                >
                  {isSubscribed ? '✓ This Device is Subscribed' : '🔔 Enable Notifications on this Browser'}
                </button>
              </div>
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(124, 58, 237, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            💡 <strong>Smart Notification Rule Active:</strong> If a habit is already marked as completed for today, all reminders to your mobile are automatically silenced! Reminders only ring for <strong>pending / uncompleted habits</strong>.
          </div>
        </div>

        <div className="modal-footer">
          <div className="active-count-badge">
            <span className="dot-live"></span>
            <span>Channel: {mobileInfo?.ntfyTopic || 'atomic-habits-pranav'}</span>
          </div>
          <button className="btn-close" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
