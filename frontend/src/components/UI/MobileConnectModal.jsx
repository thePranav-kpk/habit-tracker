import React, { useState, useEffect } from 'react';
import { habitApi } from '../../api/habitApi';
import { subscribeToPush, getExistingSubscription } from '../../utils/notificationUtils';
import AtomicLogo from './AtomicLogo';

export default function MobileConnectModal({ isOpen, onClose }) {
  const [mobileInfo, setMobileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('pc'); // 'pc' | 'mobile' | 'wifi'

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
      setStatusMsg(`🚀 ${res.message || 'Test alert dispatched! Check your PC screen and phone lockscreen now.'}`);
    } catch (err) {
      console.error(err);
      setStatusMsg('❌ Failed to dispatch test alert');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableDesktopPush = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const vapidKey = await habitApi.getVapidKey();
      if (!vapidKey) {
        throw new Error('VAPID public key not configured on backend');
      }

      const subscription = await subscribeToPush(vapidKey);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Mobile Phone' : 'PC Desktop Browser';

      await habitApi.subscribeDevice(subscription, deviceName);
      setIsSubscribed(true);
      setStatusMsg('✅ PC Desktop notifications enabled! You will receive alerts even when this tab is closed.');
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
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AtomicLogo size={28} animated={false} />
            <span>Notification & Device Center</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-intro">
            Stay consistent across all your devices. Notifications are strictly <strong>muted if the habit is already completed today</strong>.
          </p>

          {/* Status Message */}
          {statusMsg && (
            <div className={`status-banner ${statusMsg.startsWith('❌') ? 'error' : 'success'}`}>
              {statusMsg}
            </div>
          )}

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', flexWrap: 'wrap' }}>
            <button
              className={`quick-pill ${activeTab === 'pc' ? 'active' : ''}`}
              style={{
                background: activeTab === 'pc' ? 'var(--accent)' : 'var(--bg-card)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '7px 14px'
              }}
              onClick={() => setActiveTab('pc')}
            >
              💻 PC Desktop (Tab Open or Closed)
            </button>
            <button
              className={`quick-pill ${activeTab === 'mobile' ? 'active' : ''}`}
              style={{
                background: activeTab === 'mobile' ? 'var(--accent)' : 'var(--bg-card)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '7px 14px'
              }}
              onClick={() => setActiveTab('mobile')}
            >
              📱 Mobile Phone (Normal Sound)
            </button>
            <button
              className={`quick-pill ${activeTab === 'wifi' ? 'active' : ''}`}
              style={{
                background: activeTab === 'wifi' ? 'var(--accent)' : 'var(--bg-card)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '7px 14px'
              }}
              onClick={() => setActiveTab('wifi')}
            >
              🌐 Local Wi-Fi
            </button>
          </div>

          {/* TAB 1: PC DESKTOP (TAB OPEN OR CLOSED) */}
          {activeTab === 'pc' && (
            <div className="connect-section" style={{ border: '1px solid var(--accent)' }}>
              <h4 className="section-title">💻 Receive Alerts on PC Even When Tab is Closed</h4>
              <p className="section-desc">
                Enables background <strong>W3C Web Push & Service Worker</strong>. When your habit reminder time arrives, your computer will display a desktop alert (Windows Action Center / Mac Notification Center) with <strong>✓ Done</strong> and <strong>⏰ Later (+30m)</strong> quick action buttons, even if you closed the browser tab!
              </p>

              <div style={{ margin: '14px 0' }}>
                <button 
                  className={`btn-primary ${isSubscribed ? 'connected' : ''}`}
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600' }}
                  onClick={handleEnableDesktopPush}
                  disabled={loading}
                >
                  {isSubscribed ? '✓ PC Desktop Background Notifications Active' : '🔔 Enable PC Desktop Notifications (1-Click)'}
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <p><strong>Note on PC behavior:</strong></p>
                <ul style={{ paddingLeft: '18px', marginTop: '4px' }}>
                  <li>Notifications use <code>requireInteraction: true</code> so they stay visible until you interact.</li>
                  <li>Clicking <strong>✓ Done</strong> directly on the PC notification updates MongoDB and your streak board immediately.</li>
                  <li>You can also open <a href={mobileInfo?.ntfyUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-light)' }}>{mobileInfo?.ntfyUrl}</a> on your PC and click "Subscribe" for an extra redundant desktop channel.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: MOBILE PHONE (STANDARD APP SOUND) */}
          {activeTab === 'mobile' && (
            <div className="connect-section" style={{ border: '1px solid var(--accent)' }}>
              <h4 className="section-title">📱 Connect Mobile Phone (Android & iOS)</h4>
              <p className="section-desc">
                Plays your phone's <strong>standard app notification chime</strong> (same as WhatsApp, Telegram, or Gmail) — not loud sirens or ringtones!
              </p>

              {mobileInfo && (
                <div className="qr-container">
                  <img src={mobileInfo.qrCodeDataUrl} alt="Scan QR Code" className="qr-image" />
                  <div className="qr-info">
                    <span className="qr-label">1. Scan with phone camera or visit:</span>
                    <a href={mobileInfo.ntfyUrl} target="_blank" rel="noreferrer" className="mobile-link">
                      {mobileInfo.ntfyUrl}
                    </a>
                    <span className="qr-sub">2. Tap <strong>"Subscribe"</strong> (or open in free ntfy app)</span>
                    <span className="qr-sub">3. Standard phone sound & vibration are pre-configured!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WI-FI APP PAIRING */}
          {activeTab === 'wifi' && (
            <div className="connect-section">
              <h4 className="section-title">🌐 Open Full App on Mobile via Local Wi-Fi</h4>
              <p className="section-desc">
                Open the interactive Habit Tracker UI directly in your mobile browser:
              </p>

              {mobileInfo && (
                <div className="qr-container">
                  <img src={mobileInfo.localAppQrCode} alt="Local App QR" className="qr-image" />
                  <div className="qr-info">
                    <span className="qr-label">Local Wi-Fi Address:</span>
                    <a href={mobileInfo.mobileUrl} target="_blank" rel="noreferrer" className="mobile-link">
                      {mobileInfo.mobileUrl}
                    </a>
                    <span className="qr-sub">Your phone and PC must be on the same Wi-Fi network</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Universal Test Button */}
          <div style={{ marginTop: '14px' }}>
            <button 
              className="btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '13px', background: 'rgba(124, 58, 237, 0.25)', border: '1px solid var(--accent)' }}
              onClick={handleSendTest}
              disabled={loading}
            >
              ⚡ Send Live Test Alert to PC & Phone Now
            </button>
          </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(124, 58, 237, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            🛡️ <strong>Smart Notification Rule:</strong> Reminders ring <strong>ONLY for pending / uncompleted habits</strong>. If a habit was already completed today, reminders to both PC and phone are completely suppressed!
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
