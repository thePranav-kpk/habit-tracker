import { getLocalDateString } from './dateUtils';

export function computeStreakStats(dailyLogs = {}) {
  const todayStr = getLocalDateString();
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  const activeDates = new Set();
  let totalCompletions = 0;

  for (const [dateStr, log] of Object.entries(dailyLogs)) {
    if (log && log.completedCount > 0) {
      activeDates.add(dateStr);
      totalCompletions += log.completedCount;
    }
  }

  const todayCompleted = activeDates.has(todayStr);
  const yesterdayCompleted = activeDates.has(yesterdayStr);

  let currentStreak = 0;
  if (todayCompleted) {
    let cur = new Date();
    while (true) {
      const dStr = getLocalDateString(cur);
      if (activeDates.has(dStr)) {
        currentStreak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (yesterdayCompleted) {
    // Preserve streak from yesterday until end of day today
    let cur = new Date(yesterdayDate);
    while (true) {
      const dStr = getLocalDateString(cur);
      if (activeDates.has(dStr)) {
        currentStreak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // Calculate longest streak
  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dStr of sortedDates) {
    const parts = dStr.split('-').map(Number);
    const curDate = new Date(parts[0], parts[1] - 1, parts[2]);

    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays === 0) {
        // duplicate, ignore
      } else {
        tempStreak = 1;
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    todayCompleted,
    streakAtRisk: !todayCompleted && yesterdayCompleted && currentStreak > 0
  };
}

export function getMilestoneDetails(streak = 0) {
  if (streak >= 100) {
    return {
      tier: 'tier-100',
      title: '👑 100-Day Centurion',
      sub: 'Unshakeable mastery achieved!'
    };
  } else if (streak >= 66) {
    return {
      tier: 'tier-66',
      title: '🚀 66-Day Automaticity',
      sub: 'Habit is now automatic (Atomic Habits principle)!'
    };
  } else if (streak >= 21) {
    return {
      tier: 'tier-21',
      title: '⚡ 21-Day Habit Formed',
      sub: 'Strong neural pathways established!'
    };
  } else if (streak >= 7) {
    return {
      tier: 'tier-7',
      title: '🌱 7-Day Consistency',
      sub: 'First week milestone achieved!'
    };
  } else {
    return {
      tier: 'tier-0',
      title: '🎯 Building Momentum',
      sub: streak === 0 
        ? 'Complete a habit today to start your streak' 
        : `${7 - streak} day${7 - streak === 1 ? '' : 's'} until 7-day milestone`
    };
  }
}
