const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      maxlength: [100, 'Habit name cannot exceed 100 characters']
    },
    lastDoneDate: {
      type: String,
      default: null,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    order: {
      type: Number,
      default: 0
    },
    reminderTime: {
      type: String,
      default: null, // format "HH:mm" (24h) e.g. "08:00"
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be formatted as HH:mm']
    },
    reminderEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Habit', HabitSchema);
