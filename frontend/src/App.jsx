import React, { useState, useEffect, useCallback } from 'react';
import HabitInput from './components/LeftPanel/HabitInput';
import HabitList from './components/LeftPanel/HabitList';
import StatsRow from './components/RightPanel/StatsRow';
import HeatmapBoard from './components/RightPanel/HeatmapBoard';
import WisdomSection from './components/RightPanel/WisdomSection';
import Confetti from './components/UI/Confetti';
import MobileConnectModal from './components/UI/MobileConnectModal';
import { habitApi } from './api/habitApi';
import { getLocalDateString } from './utils/dateUtils';
import { computeStreakStats, getMilestoneDetails } from './utils/streakUtils';
import { playCelebrationChime } from './utils/audioUtils';
import { registerServiceWorker } from './utils/notificationUtils';

export default function App() {
  const [habits, setHabits] = useState([]);
  const [dailyLogs, setDailyLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confettiOrigin, setConfettiOrigin] = useState(null);
  const [todayStr, setTodayStr] = useState(getLocalDateString());
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Show temporary toast message
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Initialize service worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Load data from Backend API
  const loadData = useCallback(async () => {
    try {
      const [fetchedHabits, fetchedLogs] = await Promise.all([
        habitApi.getHabits(),
        habitApi.getLogs()
      ]);
      setHabits(fetchedHabits);
      setDailyLogs(fetchedLogs);
      setError(null);
    } catch (err) {
      console.error('Failed to load data from backend:', err);
      setError('Connecting to backend server / MongoDB Atlas...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Midnight rollover checker
    const timer = setInterval(() => {
      const cur = getLocalDateString();
      if (cur !== todayStr) {
        setTodayStr(cur);
        loadData();
      }
    }, 30000);

    // Window focus refresh for multi-tab and mobile notification sync
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData, todayStr]);

  // Handle Add Habit
  const handleAddHabit = async (habitData) => {
    try {
      const newHabit = await habitApi.createHabit(habitData);
      setHabits(prev => [...prev, newHabit]);
      showToast(`Added habit: "${newHabit.name}"`);
    } catch (err) {
      console.error('Add habit error:', err);
    }
  };

  // Handle Update Habit
  const handleUpdateHabit = async (id, fields) => {
    try {
      const updated = await habitApi.updateHabit(id, fields);
      setHabits(prev => prev.map(h => ((h._id || h.id) === id ? updated : h)));
    } catch (err) {
      console.error('Update habit error:', err);
    }
  };

  // Handle Delete Habit
  const handleDeleteHabit = async (id) => {
    try {
      await habitApi.deleteHabit(id);
      setHabits(prev => prev.filter(h => (h._id || h.id) !== id));
      const updatedLogs = await habitApi.getLogs();
      setDailyLogs(updatedLogs);
      showToast('Habit deleted.');
    } catch (err) {
      console.error('Delete habit error:', err);
    }
  };

  // Handle Snooze / Do Later
  const handleSnoozeHabit = async (id, options) => {
    try {
      const result = await habitApi.snoozeHabit(id, options);
      if (result && result.habit) {
        setHabits(prev => prev.map(h => ((h._id || h.id) === id ? result.habit : h)));
        showToast(`⏰ Rescheduled for ${result.newTime}! We'll remind you on mobile then.`);
      }
    } catch (err) {
      console.error('Snooze error:', err);
    }
  };

  // Handle Toggle Done (reflects immediately on Streakboard)
  const handleToggleDone = async (id, event) => {
    const habit = habits.find(h => (h._id || h.id) === id);
    if (!habit) return;

    const willBeDone = habit.lastDoneDate !== todayStr;

    // 1. Optimistic UI update: Habit List
    setHabits(prev => prev.map(h => {
      if ((h._id || h.id) === id) {
        return { ...h, lastDoneDate: willBeDone ? todayStr : null };
      }
      return h;
    }));

    // 2. Optimistic UI update: Streakboard & Daily Log Heatmap
    setDailyLogs(prev => {
      const current = prev[todayStr] || { date: todayStr, completedCount: 0, habitIds: [] };
      const currentIds = Array.isArray(current.habitIds) ? current.habitIds : [];
      let newIds = [];
      let newCount = current.completedCount || 0;

      if (willBeDone) {
        newIds = [...new Set([...currentIds, id])];
        newCount += 1;
      } else {
        newIds = currentIds.filter(hId => (hId._id || hId) !== id);
        newCount = Math.max(0, newCount - 1);
      }

      return {
        ...prev,
        [todayStr]: {
          ...current,
          completedCount: newCount,
          habitIds: newIds
        }
      };
    });

    if (willBeDone) {
      playCelebrationChime();
      if (event) {
        const rect = event.target.getBoundingClientRect();
        setConfettiOrigin({ x: rect.left + rect.width / 2, y: rect.top });
      } else {
        setConfettiOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
      showToast(`🔥 "${habit.name}" completed! Streak updated.`);
    }

    // 3. Persist to Backend API & MongoDB Atlas
    try {
      const result = await habitApi.toggleHabit(id, todayStr);
      if (result.dailyLog) {
        setDailyLogs(prev => ({
          ...prev,
          [todayStr]: result.dailyLog
        }));
      }
    } catch (err) {
      console.error('Toggle habit error:', err);
      loadData();
    }
  };

  const stats = computeStreakStats(dailyLogs);
  const milestone = getMilestoneDetails(stats.currentStreak);
  const completedTodayCount = habits.filter(h => h.lastDoneDate === todayStr).length;

  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="app-layout">
      {/* Top Banner with Mobile Connect & Sync Status */}
      <div className="app-top-nav">
        <div className="nav-left">
          <span className="live-dot"></span>
          <span className="nav-status-text">MongoDB Atlas Connected</span>
          <a 
            href="/api/health" 
            target="_blank" 
            rel="noreferrer" 
            className="cron-health-pill" 
            title="View Health & Cron endpoint"
          >
            Health & Cron API
          </a>
        </div>

        <button 
          className="connect-mobile-btn" 
          onClick={() => setIsMobileModalOpen(true)}
          title="Connect phone to receive habit alerts"
        >
          <span>📱</span>
          <span>Connect Mobile Phone</span>
        </button>
      </div>

      {toastMsg && (
        <div className="floating-toast">
          <span>{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="backend-alert-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadData} className="retry-btn">Retry Connection</button>
        </div>
      )}

      <div className="app-container">
        {/* ================= LEFT PANEL ================= */}
        <aside className="left-panel">
          <div className="panel-header">
            <div className="brand-row">
              <h1 className="brand-title">
                <span className="brand-title-accent">My Habits</span>
              </h1>
              <span className="date-badge">{formattedToday}</span>
            </div>
            <p className="brand-tagline">Small habits. Remarkable results.</p>
          </div>

          <HabitInput onAddHabit={handleAddHabit} />

          <div className="list-meta-bar">
            <span>{habits.length} habit{habits.length === 1 ? '' : 's'}</span>
            <span className="progress-pill">
              {completedTodayCount} / {habits.length} done today
            </span>
          </div>

          <HabitList
            habits={habits}
            onToggle={handleToggleDone}
            onUpdate={handleUpdateHabit}
            onDelete={handleDeleteHabit}
            onSnooze={handleSnoozeHabit}
            onQuickAdd={(name) => handleAddHabit({ name, reminderTime: '08:00', reminderEnabled: true })}
          />
        </aside>

        {/* ================= RIGHT PANEL ================= */}
        <main className="right-panel">
          <div className="right-panel-header">
            <div className="board-title-row">
              <div>
                <h2 className="board-title">
                  <span className="board-accent">Streak Board</span>
                </h2>
                <p className="board-subtitle">Visualizing 365 days of continuous consistency</p>
              </div>
              <div className={`milestone-badge-pill ${milestone.tier}`}>
                {milestone.title}
              </div>
            </div>
          </div>

          <div className="right-panel-content">
            <StatsRow
              stats={stats}
              totalHabits={habits.length}
              completedTodayCount={completedTodayCount}
            />

            <HeatmapBoard dailyLogs={dailyLogs} habits={habits} />

            <WisdomSection />
          </div>
        </main>
      </div>

      <Confetti triggerOrigin={confettiOrigin} />
      
      <MobileConnectModal 
        isOpen={isMobileModalOpen} 
        onClose={() => setIsMobileModalOpen(false)} 
      />
    </div>
  );
}
