import React, { useState } from 'react';

export default function HabitInput({ onAddHabit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddHabit(name.trim());
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
          <button type="submit" className="add-btn" title="Add Habit (Enter)">
            +
          </button>
        </div>
      </form>
    </div>
  );
}
