import React from 'react';
import StatCard from './StatCard';
import { getMilestoneDetails } from '../../utils/streakUtils';

export default function StatsRow({ stats, totalHabits, completedTodayCount }) {
  const milestone = getMilestoneDetails(stats.currentStreak);

  let streakSub = milestone.sub;
  if (stats.todayCompleted) {
    streakSub = `✓ Extended today! (${milestone.sub})`;
  } else if (stats.streakAtRisk) {
    streakSub = `⚠️ Active streak! Complete today to continue.`;
  }

  const todayPct = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  return (
    <div className="stats-row">
      <StatCard
        label="Current Streak"
        icon="🔥"
        value={stats.currentStreak}
        unit="days"
        sub={streakSub}
        isMilestoneActive={stats.currentStreak >= 7}
      />
      <StatCard
        label="Longest Streak"
        icon="🏆"
        value={stats.longestStreak}
        unit="days"
        sub="All-time personal best"
      />
      <StatCard
        label="Total Completions"
        icon="✓"
        value={stats.totalCompletions}
        unit="check-ins"
        sub="Across all recorded habits"
      />
      <StatCard
        label="Today's Progress"
        icon="⚡"
        value={`${todayPct}%`}
        sub={`${completedTodayCount} of ${totalHabits} habits completed`}
      />
    </div>
  );
}
