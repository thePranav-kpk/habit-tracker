const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const Subscription = require('../models/Subscription');
const DailyLog = require('../models/DailyLog');
const { sendPushNotification } = require('../services/pushService');
const { sendNtfyNotification } = require('../services/ntfyService');

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

// Helper to format time in IST (Asia/Kolkata: UTC+5:30)
function getCurrentTimeString(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

// Helper to format YYYY-MM-DD in IST (Asia/Kolkata: UTC+5:30)
function getTodayDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// Format seconds into readable uptime
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

// Health check handler
const getHealth = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const todayStr = getTodayDateString();

    let habitsCount = 0;
    let subscriptionsCount = 0;
    let completedToday = 0;

    if (isDbConnected) {
      [habitsCount, subscriptionsCount] = await Promise.all([
        Habit.countDocuments(),
        Subscription.countDocuments()
      ]);
      const todayLog = await DailyLog.findOne({ date: todayStr });
      completedToday = todayLog ? todayLog.completedCount : 0;
    }

    res.status(200).json({
      status: 'ok',
      service: 'atomic-habits-api',
      uptime: formatUptime(process.uptime()),
      timestamp: new Date().toISOString(),
      currentTime: getCurrentTimeString(),
      today: todayStr,
      database: {
        status: isDbConnected ? 'connected' : 'disconnected',
        host: isDbConnected ? mongoose.connection.host : null,
        name: isDbConnected ? mongoose.connection.name : null
      },
      telemetry: {
        totalHabits: habitsCount,
        completedToday,
        pendingToday: Math.max(0, habitsCount - completedToday),
        activeMobileSubscriptions: subscriptionsCount
      },
      cronScheduler: 'active'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Cron trigger handler: strictly notify ONLY IF task is NOT completed today
const triggerCronCheck = async (req, res) => {
  try {
    const currentTime = req.query.time || getCurrentTimeString();
    const todayDate = getTodayDateString();

    // Fast-fail if DB is not connected yet (avoids serverless hanging)
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: false,
        message: 'Database connection is not ready. Cron check deferred.',
        currentTime,
        todayDate
      });
    }

    // 1. Fetch today's DailyLog to find completed habits
    const todayLog = await DailyLog.findOne({ date: todayDate });
    const completedIds = new Set(
      (todayLog && Array.isArray(todayLog.habitIds))
        ? todayLog.habitIds.map(id => id.toString())
        : []
    );

    // 2. Query habits scheduled for this time
    const scheduledHabits = await Habit.find({
      reminderEnabled: true,
      reminderTime: currentTime
    });

    // 3. Filter: Exclude any habits already completed today
    const uncompletedHabits = scheduledHabits.filter(habit => {
      const isDoneByDate = (habit.lastDoneDate === todayDate);
      const isDoneByLog = completedIds.has(habit._id.toString());
      return !isDoneByDate && !isDoneByLog;
    });

    const results = [];
    const ntfyTopic = process.env.NTFY_TOPIC || 'atomic-habits-pranav';
    const localIp = getLocalIpAddress();

    for (const habit of uncompletedHabits) {
      const payload = {
        title: `⏰ Pending Habit: ${habit.name}`,
        body: `Scheduled for ${currentTime}. Complete it now to protect your streak! 🔥`,
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

      sendPushNotification(payload).catch(() => {});

      const ntfyRes = await sendNtfyNotification(ntfyTopic, {
        title: `Pending Habit: ${habit.name}`,
        message: `It's ${currentTime}! You have not completed "${habit.name}" yet today. Protect your streak!`,
        priority: 'high',
        tags: 'calendar,white_check_mark',
        clickUrl: `http://${localIp}:5173`
      });

      results.push({
        habitId: habit._id,
        name: habit.name,
        reminderTime: habit.reminderTime,
        ntfyDelivered: ntfyRes.success
      });
    }

    res.status(200).json({
      success: true,
      message: `Cron check executed for ${currentTime}. Filtered out completed tasks.`,
      scheduledHabitsCount: scheduledHabits.length,
      notifiedUncompletedCount: uncompletedHabits.length,
      alreadyCompletedCount: scheduledHabits.length - uncompletedHabits.length,
      currentTime,
      todayDate,
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Route mappings
router.get('/', getHealth);
router.get('/check', triggerCronCheck);
router.get('/trigger', triggerCronCheck);

module.exports = { router, getHealth, triggerCronCheck };
