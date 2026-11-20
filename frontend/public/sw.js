// Service Worker for Atomic Habits Mobile Notifications & Quick Actions

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Habit Reminder', body: event.data.text() };
    }
  }

  const title = data.title || '⏰ Habit Reminder';
  const options = {
    body: data.body || 'Time to complete your habit! Protect your streak. 🔥',
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'habit-reminder',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    actions: data.actions || [
      { action: 'mark-done', title: '✓ Done' },
      { action: 'snooze-30', title: '⏰ Later (+30m)' },
      { action: 'open', title: '📱 Open App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const habitData = event.notification.data || {};
  const habitId = habitData.habitId;

  // 1. Direct Mark Done from Notification
  if (event.action === 'mark-done' && habitId) {
    event.waitUntil(
      fetch(`/api/habits/${habitId}/complete-today`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then((res) => res.json())
      .then((result) => {
        return self.registration.showNotification('🎉 Habit Completed!', {
          body: `Awesome! "${habitData.name || 'Habit'}" is marked done for today. Your streakboard is updated! 🔥`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'habit-done-confirmation'
        });
      })
      .catch((err) => {
        console.error('Failed to mark done from notification:', err);
      })
    );
    return;
  }

  // 2. Direct Snooze (+30m) from Notification
  if (event.action === 'snooze-30' && habitId) {
    event.waitUntil(
      fetch(`/api/habits/${habitId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 30 })
      })
      .then((res) => res.json())
      .then((result) => {
        const newTime = (result.data && result.data.newTime) || '30 minutes';
        return self.registration.showNotification('⏰ Habit Rescheduled!', {
          body: `We will remind you again at ${newTime}. Take your time!`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'habit-snooze-confirmation'
        });
      })
      .catch((err) => {
        console.error('Failed to snooze from notification:', err);
      })
    );
    return;
  }

  // 3. Default: Open/Focus App
  const targetUrl = habitData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
