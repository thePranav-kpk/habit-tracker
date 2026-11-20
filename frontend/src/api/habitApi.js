const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const habitApi = {
  async getHabits() {
    const res = await fetch(`${API_BASE}/habits`);
    if (!res.ok) throw new Error('Failed to fetch habits');
    const json = await res.json();
    return json.data || [];
  },

  async createHabit(name) {
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to create habit');
    const json = await res.json();
    return json.data;
  },

  async updateHabit(id, name) {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
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
  }
};
