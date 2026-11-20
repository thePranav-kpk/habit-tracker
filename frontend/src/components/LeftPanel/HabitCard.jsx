import React, { useState, useRef, useEffect } from 'react';

export default function HabitCard({ habit, isDone, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(habit.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== habit.name) {
      onUpdate(habit._id || habit.id, trimmed);
    } else {
      setEditText(habit.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(habit.name);
      setIsEditing(false);
    }
  };

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
              onBlur={handleSave}
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
