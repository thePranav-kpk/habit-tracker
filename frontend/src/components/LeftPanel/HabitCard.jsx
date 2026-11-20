import React, { useState, useRef, useEffect } from 'react';

export default function HabitCard({ habit, isDone, onToggle, onUpdate, onDelete, onSnooze }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(habit.name);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [customTime, setCustomTime] = useState(habit.reminderTime || '20:00');
  const inputRef = useRef(null);
  const snoozeRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Click outside to close snooze menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (snoozeRef.current && !snoozeRef.current.contains(event.target)) {
        setShowSnoozeMenu(false);
      }
    }
    if (showSnoozeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSnoozeMenu]);

  const handleSaveName = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== habit.name) {
      onUpdate(habit._id || habit.id, { name: trimmed });
    } else {
      setEditText(habit.name);
    }
    setIsEditing(false);
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

  const handleToggleReminder = (e) => {
    e.stopPropagation();
    const newEnabled = !(habit.reminderEnabled !== false);
    onUpdate(habit._id || habit.id, { reminderEnabled: newEnabled });
  };

  const handleQuickSnooze = (minutes) => {
    onSnooze(habit._id || habit.id, { minutes });
    setShowSnoozeMenu(false);
  };

  const handleCustomTimeSubmit = (e) => {
    e.preventDefault();
    if (customTime) {
      onSnooze(habit._id || habit.id, { time: customTime });
      setShowSnoozeMenu(false);
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

      {/* Reminder & Snooze Row */}
      <div className="habit-reminder-row" ref={snoozeRef}>
        <div 
          className={`reminder-badge ${isReminderActive ? 'active' : 'disabled'}`}
          onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
          title="Click to reschedule or snooze habit"
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

        {/* Do Later / Snooze Button */}
        <button 
          className="do-later-btn"
          onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
          title="Do this habit later"
        >
          <span>⏳ Do Later</span>
        </button>

        {/* Snooze / Reschedule Dropdown Menu */}
        {showSnoozeMenu && (
          <div className="snooze-popup-menu">
            <div className="snooze-title">Reschedule Habit:</div>
            <div className="snooze-options-grid">
              <button onClick={() => handleQuickSnooze(15)} className="snooze-chip">+15 mins</button>
              <button onClick={() => handleQuickSnooze(30)} className="snooze-chip">+30 mins</button>
              <button onClick={() => handleQuickSnooze(60)} className="snooze-chip">+1 hour</button>
              <button onClick={() => { setCustomTime('20:00'); onSnooze(habit._id || habit.id, { time: '20:00' }); setShowSnoozeMenu(false); }} className="snooze-chip">Tonight 8PM</button>
            </div>
            
            <form onSubmit={handleCustomTimeSubmit} className="snooze-custom-form">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Or exact time:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input 
                  type="time" 
                  className="time-input-mini"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  required
                />
                <button type="submit" className="snooze-set-btn">Set</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="habit-actions">
        <button 
          className={`toggle-done-btn ${isDone ? 'done' : ''}`}
          onClick={(e) => onToggle(habit._id || habit.id, e)}
        >
          <span className="check-icon">✓</span>
          <span>{isDone ? 'Done Today' : 'Done Today'}</span>
        </button>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          {isDone ? '✓ Reflected on Streakboard' : 'Pending today'}
        </span>
      </div>
    </div>
  );
}
