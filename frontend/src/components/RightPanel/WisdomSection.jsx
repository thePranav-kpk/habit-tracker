import React from 'react';

export default function WisdomSection() {
  return (
    <div className="wisdom-section">
      <div className="wisdom-header">
        <span className="wisdom-title">💡 The 4 Laws of Behavior Change</span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>James Clear, Atomic Habits</span>
      </div>

      <div className="wisdom-quote">
        "You do not rise to the level of your goals. You fall to the level of your systems."
      </div>

      <div className="atomic-laws-grid">
        <div className="law-card">
          <div className="law-num">1st Law</div>
          <div className="law-title">Make it Obvious</div>
          <div className="law-desc">Keep your habit cues in sight. Fill this streak board every single day.</div>
        </div>
        <div className="law-card">
          <div className="law-num">2nd Law</div>
          <div className="law-title">Make it Attractive</div>
          <div className="law-desc">Bundle habits with things you look forward to. Celebrate your milestones.</div>
        </div>
        <div className="law-card">
          <div className="law-num">3rd Law</div>
          <div className="law-title">Make it Easy</div>
          <div className="law-desc">Start small with the 2-minute rule. Consistency beats intensity every time.</div>
        </div>
        <div className="law-card">
          <div className="law-num">4th Law</div>
          <div className="law-title">Make it Satisfying</div>
          <div className="law-desc">Immediate satisfaction fuels repetition. Never break the chain twice.</div>
        </div>
      </div>
    </div>
  );
}
