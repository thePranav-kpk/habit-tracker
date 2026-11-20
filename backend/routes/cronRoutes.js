const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const Subscription = require('../models/Subscription');
const DailyLog = require('../models/DailyLog');
const { sendPushNotification } = require('../services/pushService');

// Helper to format local time HH:mm
function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper to format local YYYY-MM-DD
function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

// Cron trigger handler
const triggerCronCheck = async (req, res) => {
  try {
    const currentTime = req.query.time || getCurrentTimeString();
    const todayDate = getTodayDateString();

    const pendingHabits = await Habit.find({
      reminderEnabled: true,
      reminderTime: currentTime,
      $or: [
        { lastDoneDate: { $ne: todayDate } },
        { lastDoneDate: null }
      ]
    });

    const results = [];

    for (const habit of pendingHabits) {
      const payload = {
        title: `⏰ Time for: ${habit.name}`,
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

      const pushResult = await sendPushNotification(payload);
      results.push({
        habitId: habit._id,
        name: habit.name,
        reminderTime: habit.reminderTime,
        delivered: pushResult.sent,
        totalDevices: pushResult.total
      });

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
        } catch (e) {}
      }
    }

    res.status(200).json({
      success: true,
      message: `Cron check executed for ${currentTime}`,
      notifiedHabitsCount: pendingHabits.length,
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
