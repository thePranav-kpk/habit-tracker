import React, { useState } from 'react';

export default function HabitInput({ onAddHabit }) {
  const [name, setName] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddHabit({
      name: name.trim(),
      reminderTime: showTimePicker ? reminderTime : '08:00',
      reminderEnabled: true
    });
    setName('');
  };

  return (
    <div className="add-habit-form">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="habit-input"
            placeholder="Add a new habit... (e.g. Read 15 mins)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="off"
            required
          />

          <button
            type="button"
            className={`time-toggle-btn ${showTimePicker ? 'active' : ''}`}
            onClick={() => setShowTimePicker(!showTimePicker)}
            title="Set reminder time for phone notification"
          >
            ⏰
          </button>

          <button type="submit" className="add-btn" title="Add Habit (Enter)">
            +
          </button>
        </div>

        {showTimePicker && (
          <div className="reminder-time-row">
            <span className="reminder-label">🔔 Remind phone at:</span>
            <input
              type="time"
              className="time-input"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
        )}
      </form>
    </div>
  );
}
