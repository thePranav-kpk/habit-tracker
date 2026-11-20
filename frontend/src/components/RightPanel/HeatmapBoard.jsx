import React, { useState, useRef, useEffect } from 'react';
import { buildHeatmapGrid } from '../../utils/dateUtils';
import HeatmapTooltip from './HeatmapTooltip';

export default function HeatmapBoard({ dailyLogs, habits }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, day: null });
  const scrollRef = useRef(null);

  const { monthLabels, weeks } = buildHeatmapGrid(dailyLogs, habits);

  // Auto-scroll to today/recent weeks on mobile screens
  useEffect(() => {
    if (scrollRef.current && window.innerWidth <= 768) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const handleMouseEnter = (e, day) => {
    if (day.isFuture) return;
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    setTooltip({ visible: true, x, y, day });
  };

  const handleMouseMove = (e) => {
    if (!tooltip.visible) return;
    const tooltipWidth = 180;
    const tooltipHeight = 70;
    let x = e.clientX + 14;
    let y = e.clientY + 14;

    if (x + tooltipWidth > window.innerWidth) {
      x = e.clientX - tooltipWidth - 14;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = e.clientY - tooltipHeight - 14;
    }

    setTooltip(prev => ({ ...prev, x, y }));
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, day: null });
  };

  return (
    <div className="heatmap-card">
      <div className="heatmap-top-bar">
        <div className="heatmap-heading">
          <span>Last 365 Days Activity</span>
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          <span className="legend-cell legend-0" title="0 completions"></span>
          <span className="legend-cell legend-1" title="1 completion"></span>
          <span className="legend-cell legend-2" title="2 completions"></span>
          <span className="legend-cell legend-3" title="3+ completions"></span>
          <span>More</span>
        </div>
      </div>

      <div className="heatmap-outer-scroll" ref={scrollRef} onMouseLeave={handleMouseLeave}>
        <div className="heatmap-board-wrapper">
          {/* Months Header Row */}
          <div className="heatmap-months-header">
            <div style={{ width: '28px' }}></div>
            {monthLabels.map((m, i) => (
              <div key={i} className="month-label-span">
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid with Day Labels + Weeks */}
          <div className="heatmap-grid-container">
            <div className="heatmap-days-col">
              <div>Mon</div>
              <div></div>
              <div>Wed</div>
              <div></div>
              <div>Fri</div>
              <div></div>
              <div></div>
            </div>

            <div className="heatmap-weeks-grid">
              {weeks.map((week) => (
                <div key={week.colIndex} className="heatmap-week-col">
                  {week.days.map((day) => {
                    const levelClass = day.isFuture ? 'is-future' : `level-${day.level}`;
                    const todayClass = day.isToday ? 'is-today' : '';
                    return (
                      <div
                        key={day.dateStr}
                        className={`heatmap-cell ${levelClass} ${todayClass}`}
                        onMouseEnter={(e) => handleMouseEnter(e, day)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => handleMouseEnter(e, day)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <HeatmapTooltip tooltip={tooltip} />
    </div>
  );
}
