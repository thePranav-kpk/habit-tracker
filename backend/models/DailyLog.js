const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      unique: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    },
    completedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    habitIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('DailyLog', DailyLogSchema);
