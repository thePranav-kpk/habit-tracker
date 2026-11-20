const cron = require('node-cron');
const os = require('os');
const Habit = require('../models/Habit');
const DailyLog = require('../models/DailyLog');
const { sendPushNotification } = require('./pushService');
const { sendNtfyNotification } = require('./ntfyService');

// Helper to get local IPv4 address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Helper to get time in IST (Asia/Kolkata: UTC+5:30)
function getCurrentTimeString(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

// Helper to get YYYY-MM-DD in IST (Asia/Kolkata: UTC+5:30)
function getTodayDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function initScheduler() {
  console.log('[Scheduler] Initializing habit reminder cron job in IST timezone (every minute)...');

  // Midnight IST Rollover (Runs at 12:00:00 AM IST)
  cron.schedule('0 0 * * *', () => {
    const newIstDate = getTodayDateString();
    console.log(`[Scheduler] 🌙 12:00 AM IST Midnight Rollover: Starting fresh habit day for ${newIstDate} IST!`);
  }, {
    timezone: 'Asia/Kolkata'
  });

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
          console.log(`[Scheduler] Skipping "${habit.name}": already completed today (${todayDate}). No reminder sent.`);
          return false;
        }

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

          // 1. Web Push Notification to registered devices
          sendPushNotification(payload).catch(() => {});

          // 2. Fast IPv4 NTFY mobile push (Rings & vibrates phone instantly)
          const ntfyTopic = process.env.NTFY_TOPIC || 'atomic-habits-pranav';
          const localIp = getLocalIpAddress();
          await sendNtfyNotification(ntfyTopic, {
            title: `Pending Habit: ${habit.name}`,
            message: `It's ${currentTime}! You have not completed "${habit.name}" yet today. Protect your streak!`,
            priority: 'high',
            tags: 'calendar,white_check_mark',
            clickUrl: `http://${localIp}:5173`
          });
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error running habit reminder job:', err.message);
    }
  });
}

module.exports = { initScheduler };
