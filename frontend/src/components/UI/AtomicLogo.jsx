import React from 'react';

/**
 * Atomic Habits Brand Vector Logo
 * Features atomic orbital rings, electron particles, glowing nucleus, and completion checkmark
 */
export default function AtomicLogo({ size = 36, animated = true, className = '' }) {
  return (
    <svg 
      className={`atomic-logo ${animated ? 'pulse' : ''} ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Atomic Habits Logo"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="logo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer container */}
      <rect width="48" height="48" rx="12" fill="#161b22" />
      <rect width="46" height="46" x="1" y="1" rx="11" fill="none" stroke="#30363d" strokeWidth="1" />

      {/* Orbital Rings */}
      <g className={animated ? 'orbits-group' : ''}>
        {/* Ring 1 (45 deg) */}
        <ellipse 
          cx="24" 
          cy="24" 
          rx="18" 
          ry="7" 
          transform="rotate(45 24 24)" 
          fill="none" 
          stroke="url(#orbit-grad)" 
          strokeWidth="2.2" 
          strokeOpacity="0.85" 
        />
        {/* Ring 2 (-45 deg) */}
        <ellipse 
          cx="24" 
          cy="24" 
          rx="18" 
          ry="7" 
          transform="rotate(-45 24 24)" 
          fill="none" 
          stroke="url(#orbit-grad)" 
          strokeWidth="2.2" 
          strokeOpacity="0.85" 
        />

        {/* Orbiting particles */}
        <circle cx="11.2" cy="11.2" r="2.5" fill="#a78bfa" filter="url(#logo-glow)" />
        <circle cx="36.8" cy="11.2" r="2.5" fill="#38bdf8" filter="url(#logo-glow)" />
        <circle cx="36.8" cy="36.8" r="2" fill="#a78bfa" opacity="0.9" />
      </g>

      {/* Central Atomic Nucleus with Habit Checkmark */}
      <circle cx="24" cy="24" r="8.5" fill="url(#core-grad)" filter="url(#logo-glow)" />
      <path 
        d="M20.5 24.2l2.6 2.6 4.8-5.2" 
        stroke="#ffffff" 
        strokeWidth="2.4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* Golden Streak Spark */}
      <circle cx="24" cy="4.5" r="2.2" fill="#fbbf24" />
    </svg>
  );
}
