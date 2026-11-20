const DailyLog = require('../models/DailyLog');

// Helper to format date
const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// @desc    Get all daily logs (optionally for past 365 days)
// @route   GET /api/logs
exports.getLogs = async (req, res) => {
  try {
    const logs = await DailyLog.find()
      .populate('habitIds', 'name')
      .sort({ date: 1 });

    // Format as a map or array
    const logsMap = {};
    logs.forEach(log => {
      logsMap[log.date] = log;
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logsMap,
      list: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get streak and completion statistics
// @route   GET /api/logs/stats
exports.getStats = async (req, res) => {
  try {
    const todayStr = req.query.today || getTodayDateString();
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const logs = await DailyLog.find({ completedCount: { $gt: 0 } }).sort({ date: 1 });

    const activeDates = new Set(logs.map(l => l.date));
    let totalCompletions = 0;
    logs.forEach(l => {
      totalCompletions += l.completedCount;
    });

    const todayLog = await DailyLog.findOne({ date: todayStr });
    const todayCompletedCount = todayLog ? todayLog.completedCount : 0;
    const todayDone = todayCompletedCount > 0;
    const yesterdayDone = activeDates.has(yStr);

    // Calculate current streak
    let currentStreak = 0;
    if (todayDone) {
      let cur = new Date();
      while (true) {
        const dStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        if (activeDates.has(dStr)) {
          currentStreak++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (yesterdayDone) {
      // Active streak from yesterday
      let cur = new Date(yesterdayDate);
      while (true) {
        const dStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        if (activeDates.has(dStr)) {
          currentStreak++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    const sortedDates = Array.from(activeDates).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dStr of sortedDates) {
      const parts = dStr.split('-').map(Number);
      const curDate = new Date(parts[0], parts[1] - 1, parts[2]);

      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays === 0) {
          // ignore same day
        } else {
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curDate;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    res.status(200).json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalCompletions,
        todayCompletedCount,
        todayDone,
        streakAtRisk: !todayDone && yesterdayDone && currentStreak > 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
