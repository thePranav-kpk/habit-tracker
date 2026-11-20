const Habit = require('../models/Habit');
const DailyLog = require('../models/DailyLog');

// Helper to format date in IST (Asia/Kolkata: UTC+5:30)
const getTodayDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// Helper to format HH:mm in IST (Asia/Kolkata: UTC+5:30)
const formatTimeHHmm = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

// @desc    Get all habits
// @route   GET /api/habits
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, count: habits.length, data: habits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new habit
// @route   POST /api/habits
exports.createHabit = async (req, res) => {
  try {
    const { name, reminderTime, reminderEnabled } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Habit name is required' });
    }

    const count = await Habit.countDocuments();
    const habit = await Habit.create({
      name: name.trim(),
      order: count,
      lastDoneDate: null,
      reminderTime: reminderTime || null,
      reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true
    });

    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update habit (rename, reorder, or update reminder)
// @route   PUT /api/habits/:id
exports.updateHabit = async (req, res) => {
  try {
    const updateFields = {};
    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) {
        return res.status(400).json({ success: false, error: 'Habit name cannot be empty' });
      }
      updateFields.name = req.body.name.trim();
    }
    if (req.body.reminderTime !== undefined) {
      updateFields.reminderTime = req.body.reminderTime || null;
    }
    if (req.body.reminderEnabled !== undefined) {
      updateFields.reminderEnabled = Boolean(req.body.reminderEnabled);
    }
    if (req.body.order !== undefined) {
      updateFields.order = req.body.order;
    }

    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }

    res.status(200).json({ success: true, data: habit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete habit
// @route   DELETE /api/habits/:id
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }

    const targetDate = habit.lastDoneDate;
    await habit.deleteOne();

    // Clean up from daily log if it was done on lastDoneDate
    if (targetDate) {
      const dailyLog = await DailyLog.findOne({ date: targetDate });
      if (dailyLog && dailyLog.habitIds.includes(habit._id)) {
        dailyLog.habitIds = dailyLog.habitIds.filter(id => id.toString() !== habit._id.toString());
        dailyLog.completedCount = Math.max(0, dailyLog.completedCount - 1);
        await dailyLog.save();
      }
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Toggle habit completion for today
// @route   POST /api/habits/:id/toggle
exports.toggleHabit = async (req, res) => {
  try {
    const targetDate = req.body.date || getTodayDateString();
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }

    const isCurrentlyDoneOnTarget = (habit.lastDoneDate === targetDate);

    let dailyLog = await DailyLog.findOne({ date: targetDate });
    if (!dailyLog) {
      dailyLog = new DailyLog({
        date: targetDate,
        completedCount: 0,
        habitIds: []
      });
    }

    let isDone = false;
    if (isCurrentlyDoneOnTarget) {
      // Untoggle: mark not done
      habit.lastDoneDate = null;
      dailyLog.habitIds = dailyLog.habitIds.filter(id => id.toString() !== habit._id.toString());
      dailyLog.completedCount = Math.max(0, dailyLog.completedCount - 1);
      isDone = false;
    } else {
      // Toggle ON: mark done today
      habit.lastDoneDate = targetDate;
      if (!dailyLog.habitIds.some(id => id.toString() === habit._id.toString())) {
        dailyLog.habitIds.push(habit._id);
      }
      dailyLog.completedCount = dailyLog.habitIds.length;
      isDone = true;
    }

    await habit.save();
    await dailyLog.save();

    res.status(200).json({
      success: true,
      data: {
        habit,
        isDone,
        dailyLog
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Mark habit complete for today (idempotent, ideal for mobile notifications)
// @route   POST /api/habits/:id/complete-today
exports.completeToday = async (req, res) => {
  try {
    const targetDate = req.body.date || getTodayDateString();
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }

    habit.lastDoneDate = targetDate;
    await habit.save();

    let dailyLog = await DailyLog.findOne({ date: targetDate });
    if (!dailyLog) {
      dailyLog = new DailyLog({
        date: targetDate,
        completedCount: 1,
        habitIds: [habit._id]
      });
    } else {
      if (!dailyLog.habitIds.some(id => id.toString() === habit._id.toString())) {
        dailyLog.habitIds.push(habit._id);
      }
      dailyLog.completedCount = dailyLog.habitIds.length;
    }
    await dailyLog.save();

    res.status(200).json({
      success: true,
      message: `Marked "${habit.name}" as done today!`,
      data: {
        habit,
        dailyLog,
        isDone: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Snooze or Reschedule habit reminder from mobile
// @route   POST /api/habits/:id/snooze
exports.snoozeHabit = async (req, res) => {
  try {
    const { minutes, time } = req.body;
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }

    let targetTime = null;

    if (time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      targetTime = time;
    } else if (minutes && !isNaN(Number(minutes))) {
      const futureDate = new Date(Date.now() + Number(minutes) * 60000);
      targetTime = formatTimeHHmm(futureDate);
    } else {
      // Default snooze: +30 minutes
      const futureDate = new Date(Date.now() + 30 * 60000);
      targetTime = formatTimeHHmm(futureDate);
    }

    habit.reminderTime = targetTime;
    habit.reminderEnabled = true;
    await habit.save();

    console.log(`[Snooze] Habit "${habit.name}" rescheduled to ${targetTime}`);

    res.status(200).json({
      success: true,
      message: `Habit "${habit.name}" rescheduled for ${targetTime}`,
      data: {
        habit,
        newTime: targetTime
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
