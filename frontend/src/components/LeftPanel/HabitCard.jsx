import React, { useState, useRef, useEffect } from 'react';

export default function HabitCard({ habit, isDone, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(habit.name);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || '08:00');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== habit.name) {
      onUpdate(habit._id || habit.id, { name: trimmed });
    } else {
      setEditText(habit.name);
    }
    setIsEditing(false);
  };

  const handleTimeChange = (newTime) => {
    setReminderTime(newTime);
    onUpdate(habit._id || habit.id, { reminderTime: newTime, reminderEnabled: true });
    setIsEditingTime(false);
  };

  const handleToggleReminder = (e) => {
    e.stopPropagation();
    const newEnabled = !(habit.reminderEnabled !== false);
    onUpdate(habit._id || habit.id, { reminderEnabled: newEnabled });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditText(habit.name);
      setIsEditing(false);
    }
  };

  const isReminderActive = habit.reminderTime && habit.reminderEnabled !== false;

  return (
    <div className={`habit-card ${isDone ? 'is-completed' : ''}`}>
      <div className="habit-card-top">
        <div 
          className="habit-name-wrapper"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to rename"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className="habit-inline-edit"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              maxLength={80}
            />
          ) : (
            <>
              <span className="habit-name">{habit.name}</span>
              <div className="edit-hint">Double-click to rename</div>
            </>
          )}
        </div>

        <button 
          className="delete-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(habit._id || habit.id);
          }}
          title="Delete habit"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {/* Reminder Row */}
      <div className="habit-reminder-row">
        {isEditingTime ? (
          <div className="time-edit-inline">
            <input
              type="time"
              className="time-input-mini"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              onBlur={() => handleTimeChange(reminderTime)}
              autoFocus
            />
          </div>
        ) : (
          <div 
            className={`reminder-badge ${isReminderActive ? 'active' : 'disabled'}`}
            onClick={() => setIsEditingTime(true)}
            title="Click to change phone reminder time"
          >
            <span>⏰</span>
            <span>{habit.reminderTime ? habit.reminderTime : 'Set Time'}</span>
            <button 
              className="reminder-toggle-dot" 
              onClick={handleToggleReminder}
              title={isReminderActive ? 'Turn off reminder' : 'Turn on reminder'}
            >
              {isReminderActive ? '🔔' : '🔕'}
            </button>
          </div>
        )}
      </div>

      <div className="habit-actions">
        <button 
          className={`toggle-done-btn ${isDone ? 'done' : ''}`}
          onClick={(e) => onToggle(habit._id || habit.id, e)}
        >
          <span className="check-icon">✓</span>
          <span>Done Today</span>
        </button>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          {isDone ? '✓ Completed' : 'Pending today'}
        </span>
      </div>
    </div>
  );
}
