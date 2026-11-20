const cron = require('node-cron');
const Habit = require('../models/Habit');
const { sendPushNotification } = require('./pushService');

// Helper to get local HH:mm
function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper to get local YYYY-MM-DD
function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function initScheduler() {
  console.log('[Scheduler] Initializing habit reminder cron job (every minute)...');

  cron.schedule('* * * * *', async () => {
    try {
      const currentTime = getCurrentTimeString();
      const todayDate = getTodayDateString();

      // Find all habits that are enabled, scheduled for this exact minute, and NOT completed yet today
      const pendingHabits = await Habit.find({
        reminderEnabled: true,
        reminderTime: currentTime,
        $or: [
          { lastDoneDate: { $ne: todayDate } },
          { lastDoneDate: null }
        ]
      });

      if (pendingHabits.length > 0) {
        console.log(`[Scheduler] ${currentTime}: Found ${pendingHabits.length} habit(s) to notify.`);

        for (const habit of pendingHabits) {
          const payload = {
            title: `⏰ Time for: ${habit.name}`,
            body: `Small habits, remarkable results! Complete it now to protect your streak. 🔥`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: `habit-${habit._id}-${todayDate}`,
            data: {
              habitId: habit._id,
              name: habit.name,
              url: '/'
            }
          };

          // 1. Web Push Notification to registered mobile devices
          const result = await sendPushNotification(payload);
          console.log(`[Scheduler] Dispatched WebPush for "${habit.name}": ${result.sent}/${result.total} delivered.`);

          // 2. Optional NTFY broadcast if topic configured
          const ntfyTopic = process.env.NTFY_TOPIC;
          if (ntfyTopic) {
            try {
              await fetch(`https://ntfy.sh/${ntfyTopic}`, {
                method: 'POST',
                headers: {
                  'Title': `⏰ Habit Reminder: ${habit.name}`,
                  'Priority': 'default',
                  'Tags': 'alarm_clock,fire'
                },
                body: `It's ${currentTime}! Time to complete "${habit.name}". Protect your streak!`
              });
              console.log(`[Scheduler] Dispatched ntfy.sh notification to topic: ${ntfyTopic}`);
            } catch (err) {
              console.warn('[Scheduler] NTFY broadcast error:', err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error running habit reminder job:', err.message);
    }
  });
}

module.exports = { initScheduler };
