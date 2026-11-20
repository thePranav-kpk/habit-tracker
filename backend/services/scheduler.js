const cron = require('node-cron');
const Habit = require('../models/Habit');
const DailyLog = require('../models/DailyLog');
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

      // 1. Fetch today's DailyLog to find which habits are already completed today
      const todayLog = await DailyLog.findOne({ date: todayDate });
      const completedIds = new Set(
        (todayLog && Array.isArray(todayLog.habitIds))
          ? todayLog.habitIds.map(id => id.toString())
          : []
      );

      // 2. Query all habits scheduled for this exact minute
      const scheduledHabits = await Habit.find({
        reminderEnabled: true,
        reminderTime: currentTime
      });

      if (scheduledHabits.length === 0) {
        return;
      }

      // 3. STRICT RULE:
      // If task is ALREADY completed today -> NO REMINDER to mobile!
      // Send notification to mobile ONLY IF task is NOT completed today.
      const incompleteHabits = scheduledHabits.filter(habit => {
        const isDoneByDate = (habit.lastDoneDate === todayDate);
        const isDoneByLog = completedIds.has(habit._id.toString());

        if (isDoneByDate || isDoneByLog) {
          // Already completed today: suppress reminder completely
          console.log(`[Scheduler] Skipping "${habit.name}": already completed today (${todayDate}). No reminder sent.`);
          return false;
        }

        // Not completed: proceed to notify
        return true;
      });

      if (incompleteHabits.length > 0) {
        console.log(`[Scheduler] ${currentTime}: Notifying mobile for ${incompleteHabits.length} uncompleted habit(s).`);

        for (const habit of incompleteHabits) {
          const payload = {
            title: `⏰ Pending Habit: ${habit.name}`,
            body: `You haven't completed "${habit.name}" yet today! Complete it now to protect your streak. 🔥`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: `habit-${habit._id}-${todayDate}`,
            data: {
              habitId: habit._id.toString(),
              name: habit.name,
              url: '/'
            },
            actions: [
              { action: 'mark-done', title: '✓ Done' },
              { action: 'snooze-30', title: '⏰ Later (+30m)' },
              { action: 'open', title: '📱 Open App' }
            ]
          };

          // Send WebPush to all registered mobile devices
          const result = await sendPushNotification(payload);
          console.log(`[Scheduler] Dispatched WebPush for uncompleted habit "${habit.name}": ${result.sent}/${result.total} delivered.`);

          // Optional NTFY broadcast if topic is configured
          const ntfyTopic = process.env.NTFY_TOPIC;
          if (ntfyTopic) {
            try {
              await fetch(`https://ntfy.sh/${ntfyTopic}`, {
                method: 'POST',
                headers: {
                  'Title': `⏰ Pending Habit: ${habit.name}`,
                  'Priority': 'default',
                  'Tags': 'alarm_clock,fire'
                },
                body: `You haven't completed "${habit.name}" yet today. Protect your streak!`
              });
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
