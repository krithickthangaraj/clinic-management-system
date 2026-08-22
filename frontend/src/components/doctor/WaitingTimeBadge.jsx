import React from 'react';

/**
 * Standardized WaitingTimeBadge Component
 * Dynamic Status Tiers:
 * - Normal (0 - 15 mins): Soft slate/gray badge
 * - Warning (15 - 30 mins): Soft amber badge with delicate border
 * - Critical (> 30 mins): Soft red badge with subtle pulse
 */
export default function WaitingTimeBadge({ minutes = 0, timeString = null, className = '' }) {
  const displayTime = timeString || (minutes < 1 ? '< 1 min' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`);

  let badgeStyleClass = 'waiting-badge-normal';
  if (minutes >= 30) {
    badgeStyleClass = 'waiting-badge-critical';
  } else if (minutes >= 15) {
    badgeStyleClass = 'waiting-badge-warning';
  }

  return (
    <span
      className={`waiting-time-badge ${badgeStyleClass} ${className}`}
      data-testid="waiting-time-cell"
      data-minutes={minutes}
      title={`Patient elapsed waiting time: ${displayTime}`}
    >
      <svg
        className="waiting-clock-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="waiting-time-text">{displayTime}</span>
    </span>
  );
}
