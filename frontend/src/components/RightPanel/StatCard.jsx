import React from 'react';

export default function StatCard({ label, icon, value, unit, sub, isMilestoneActive }) {
  return (
    <div className={`stat-card ${isMilestoneActive ? 'milestone-active' : ''}`}>
      <div className="stat-card-label">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <div className="stat-card-value">
        <span>{value}</span>
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
