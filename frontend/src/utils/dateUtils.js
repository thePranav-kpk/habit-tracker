/**
 * Format date in Asia/Kolkata (IST: UTC+5:30) as YYYY-MM-DD
 * Guarantees midnight rollover occurs precisely at 12:00 AM IST!
 */
export function getLocalDateString(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (e) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

/**
 * Builds a 53-week × 7-day grid ending on the current week.
 * Rows: Mon(0) to Sun(6)
 */
export function buildHeatmapGrid(dailyLogs = {}, habits = []) {
  const todayStr = getLocalDateString();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);

  // Monday = 0, ..., Sunday = 6
  const currentDayOfWeek = (todayDate.getDay() + 6) % 7;

  // 53 columns (weeks 0 to 52)
  const startDate = new Date(todayDate);
  startDate.setDate(todayDate.getDate() - (52 * 7 + currentDayOfWeek));

  const habitMap = new Map((habits || []).map(h => [h._id || h.id, h.name]));

  // Month labels header
  const monthLabels = [];
  let prevMonth = -1;
  for (let col = 0; col < 53; col++) {
    const colDate = new Date(startDate);
    colDate.setDate(startDate.getDate() + col * 7);
    const month = colDate.getMonth();

    if (month !== prevMonth && col < 51) {
      monthLabels.push({
        col,
        label: colDate.toLocaleDateString(undefined, { month: 'short' })
      });
      prevMonth = month;
    } else {
      monthLabels.push({ col, label: '' });
    }
  }

  // Weeks grid
  const weeks = [];
  for (let col = 0; col < 53; col++) {
    const days = [];
    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (col * 7 + row));
      const dateStr = getLocalDateString(cellDate);

      const isFuture = cellDate.getTime() > todayDate.getTime();
      const isToday = (dateStr === todayStr);

      const log = dailyLogs[dateStr];
      const count = (log && log.completedCount) ? log.completedCount : 0;

      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3) level = 3;

      const completedHabitNames = (log && Array.isArray(log.habitIds))
        ? log.habitIds.map(h => (typeof h === 'object' && h.name) ? h.name : (habitMap.get(h) || 'Completed Habit'))
        : [];

      days.push({
        dateStr,
        count,
        level,
        isToday,
        isFuture,
        completedHabitNames
      });
    }
    weeks.push({ colIndex: col, days });
  }

  return { monthLabels, weeks, todayStr };
}
