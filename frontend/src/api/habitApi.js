const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const habitApi = {
  // Habit CRUD
  async getHabits() {
    const res = await fetch(`${API_BASE}/habits`);
    if (!res.ok) throw new Error('Failed to fetch habits');
    const json = await res.json();
    return json.data || [];
  },

  async createHabit(data) {
    const payload = typeof data === 'string' ? { name: data } : data;
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create habit');
    const json = await res.json();
    return json.data;
  },

  async updateHabit(id, fields) {
    const payload = typeof fields === 'string' ? { name: fields } : fields;
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update habit');
    const json = await res.json();
    return json.data;
  },

  async deleteHabit(id) {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete habit');
    return true;
  },

  async toggleHabit(id, date) {
    const res = await fetch(`${API_BASE}/habits/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    if (!res.ok) throw new Error('Failed to toggle habit');
    const json = await res.json();
    return json.data; // { habit, isDone, dailyLog }
  },

  async completeToday(id, date) {
    const res = await fetch(`${API_BASE}/habits/${id}/complete-today`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    if (!res.ok) throw new Error('Failed to complete habit today');
    const json = await res.json();
    return json.data;
  },

  async snoozeHabit(id, options) {
    const res = await fetch(`${API_BASE}/habits/${id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options) // { minutes: 15/30/60 } or { time: "HH:mm" }
    });
    if (!res.ok) throw new Error('Failed to snooze habit');
    const json = await res.json();
    return json.data;
  },

  // Daily Logs & Stats
  async getLogs() {
    const res = await fetch(`${API_BASE}/logs`);
    if (!res.ok) throw new Error('Failed to fetch daily logs');
    const json = await res.json();
    return json.data || {};
  },

  async getStats(todayStr) {
    const query = todayStr ? `?today=${todayStr}` : '';
    const res = await fetch(`${API_BASE}/logs/stats${query}`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const json = await res.json();
    return json.data;
  },

  // Health & External Cron
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return await res.json();
  },

  async triggerCronCheck(time) {
    const query = time ? `?time=${time}` : '';
    const res = await fetch(`${API_BASE}/cron/check${query}`);
    if (!res.ok) throw new Error('Failed to trigger cron check');
    return await res.json();
  },

  // Push Notifications
  async getVapidKey() {
    const res = await fetch(`${API_BASE}/notifications/vapid-key`);
    if (!res.ok) throw new Error('Failed to fetch VAPID key');
    const json = await res.json();
    return json.publicKey;
  },

  async subscribeDevice(subscription, deviceName) {
    const res = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, deviceName })
    });
    if (!res.ok) throw new Error('Failed to subscribe device');
    const json = await res.json();
    return json;
  },

  async unsubscribeDevice(endpoint) {
    const res = await fetch(`${API_BASE}/notifications/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });
    if (!res.ok) throw new Error('Failed to unsubscribe device');
    const json = await res.json();
    return json;
  },

  async sendTestNotification() {
    const res = await fetch(`${API_BASE}/notifications/test`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to send test notification');
    const json = await res.json();
    return json;
  },

  async getMobileConnectInfo() {
    const res = await fetch(`${API_BASE}/notifications/mobile-info`);
    if (!res.ok) throw new Error('Failed to fetch mobile connect info');
    const json = await res.json();
    return json.data;
  }
};
