const Habit = require('../models/Habit');
const DailyLog = require('../models/DailyLog');

// Helper to format date
const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Habit name is required' });
    }

    const count = await Habit.countDocuments();
    const habit = await Habit.create({
      name: name.trim(),
      order: count,
      lastDoneDate: null
    });

    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update habit (rename)
// @route   PUT /api/habits/:id
exports.updateHabit = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Habit name is required' });
    }

    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
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
