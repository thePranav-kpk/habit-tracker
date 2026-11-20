import React from 'react';
import HabitCard from './HabitCard';
import { getLocalDateString } from '../../utils/dateUtils';

export default function HabitList({ habits, onToggle, onUpdate, onDelete, onQuickAdd }) {
  const todayStr = getLocalDateString();

  if (!habits || habits.length === 0) {
    return (
      <div className="habits-list">
        <div className="empty-habits">
          <div className="empty-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <h3 className="empty-title">No habits yet</h3>
          <p className="empty-desc">
            Every action you take is a vote for the type of person you wish to become. Add your first habit above!
          </p>
          <div className="quick-start-title">Quick Starter Habits</div>
          <div className="quick-start-pills">
            <button className="quick-pill" onClick={() => onQuickAdd('📖 Read 15 mins')}>+ Read 15m</button>
            <button className="quick-pill" onClick={() => onQuickAdd('💧 Drink 2L water')}>+ Drink 2L</button>
            <button className="quick-pill" onClick={() => onQuickAdd('🏃 20m workout')}>+ 20m Workout</button>
            <button className="quick-pill" onClick={() => onQuickAdd('🧘 5m meditation')}>+ Meditate</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="habits-list">
      {habits.map((habit) => {
        const id = habit._id || habit.id;
        const isDone = habit.lastDoneDate === todayStr;
        return (
          <HabitCard
            key={id}
            habit={habit}
            isDone={isDone}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
