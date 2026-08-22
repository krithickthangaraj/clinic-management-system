import React from 'react';

export default function DoctorDeskHeader({
  date = '',
  selectedConsultant = '',
  onConsultantChange = () => {},
  refreshing = false,
  onRefresh = () => {},
}) {
  return (
    <div className="consultation-desk-header" role="region" aria-label="Doctor Desk Header">
      {/* 1. Left Side: Title & Standardized Compact Calendar Date */}
      <div className="header-title-zone">
        <h1 className="consultation-desk-title">Consultation Desk</h1>
        <div className="consultation-date-badge" title="Today's Date">
          {/* Compact Calendar Icon (w-4 h-4) */}
          <svg
            className="calendar-compact-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="calendar-date-string">{date || 'Today'}</span>
        </div>
      </div>

      {/* 2. Right Side: Compact Controls (All Consultants Dropdown + Live Sync) */}
      <div className="header-controls-zone">
        {/* Consultant Dropdown */}
        <select
          className="consultant-select-input"
          value={selectedConsultant}
          onChange={(e) => onConsultantChange(e.target.value)}
          aria-label="Filter by Consultant"
          title="Filter queue by assigned consultant"
        >
          <option value="">All Consultants</option>
          <option value="Dr. T.S.Jeyagowthaman">Dr. T.S.Jeyagowthaman</option>
          <option value="Dr. Tamil Iniyan">Dr. Tamil Iniyan</option>
          <option value="Dr. Anuradha">Dr. Anuradha</option>
          <option value="Dr. A.K.K.Shanmugaranman">Dr. A.K.K.Shanmugaranman</option>
          <option value="Staff nurse">Staff nurse</option>
        </select>

        {/* Live Refresh Sync Button */}
        <button
          type="button"
          className={`btn-sync-action ${refreshing ? 'is-syncing' : ''}`}
          onClick={onRefresh}
          title="Live synchronize patient queue"
        >
          <svg
            className={`sync-spinner-icon ${refreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="sync-btn-label">{refreshing ? 'Syncing...' : 'Live Sync'}</span>
        </button>
      </div>
    </div>
  );
}
