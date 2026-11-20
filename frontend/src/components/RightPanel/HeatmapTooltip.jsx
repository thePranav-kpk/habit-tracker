import React from 'react';
import { formatDateDisplay } from '../../utils/dateUtils';

export default function HeatmapTooltip({ tooltip }) {
  if (!tooltip || !tooltip.visible) return null;

  const { x, y, day } = tooltip;
  const count = day.count || 0;

  return (
    <div
      className="heatmap-tooltip"
      style={{
        display: 'block',
        left: `${x}px`,
        top: `${y}px`
      }}
    >
      <div className="tooltip-date">{formatDateDisplay(day.dateStr)}</div>
      <div className="tooltip-count">
        {count === 0 ? 'No habits completed' : `${count} habit${count === 1 ? '' : 's'} completed`}
      </div>
      {day.completedHabitNames && day.completedHabitNames.length > 0 && (
        <div className="tooltip-habits-list">
          {day.completedHabitNames.map((name, i) => (
            <div key={i}>• {name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
