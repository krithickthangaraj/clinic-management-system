import React from 'react';

export default function DashboardKPIs({
  kpis = {},
  activeFilter = 'all',
  onFilterChange = () => {},
  loading = false,
}) {
  const safeKpis = {
    total_patients: kpis?.total_patients ?? 0,
    waiting: kpis?.waiting ?? 0,
    followup: kpis?.followup ?? 0,
    reports_pending: kpis?.reports_pending ?? 0,
    not_attended: kpis?.not_attended ?? 0,
    completed: kpis?.completed ?? 0,
  };

  const KPI_CONFIGS = [
    {
      id: 'all',
      key: 'total_patients',
      label: 'TOTAL PATIENTS',
      colorClass: 'kpi-total',
      accentColor: '#0f766e',
      icon: (
        <svg className="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'waiting',
      key: 'waiting',
      label: 'WAITING',
      colorClass: 'kpi-waiting',
      accentColor: '#2563eb',
      icon: (
        <svg className="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'followup',
      key: 'followup',
      label: 'FOLLOWUP',
      colorClass: 'kpi-followup',
      accentColor: '#7c3aed',
      icon: (
        <svg className="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      id: 'reports_pending',
      key: 'reports_pending',
      label: 'REPORTS PENDING',
      colorClass: 'kpi-reports',
      accentColor: '#d97706',
      icon: (
        <svg className="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: 'not_attended',
      key: 'not_attended',
      label: 'NOT ATTENDED',
      colorClass: 'kpi-not-attended',
      accentColor: '#dc2626',
      icon: (
        <svg className="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      id: 'completed',
      key: 'completed',
      label: 'COMPLETED',
      colorClass: 'kpi-completed',
      accentColor: '#059669',
      icon: (
        <svg className="kpi-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section className="dashboard-kpi-grid" aria-label="Daily KPI Summary">
      {KPI_CONFIGS.map((item) => {
        const isSelected = activeFilter === item.id;
        const count = safeKpis[item.key];

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            className={`kpi-card ${item.colorClass} ${isSelected ? 'active-filter' : ''}`}
            onClick={() => onFilterChange(item.id)}
            onKeyDown={(e) => e.key === 'Enter' && onFilterChange(item.id)}
            title={`Filter queue by ${item.label}`}
          >
            <div className="kpi-top-row">
              <span className="kpi-label-text">{item.label}</span>
              <span className="kpi-icon-wrapper">{item.icon}</span>
            </div>

            <div className="kpi-bottom-row">
              {loading ? (
                <span className="kpi-skeleton-loader" />
              ) : (
                <span className="kpi-value-digit" data-testid={`kpi-${item.key}`}>
                  {count}
                </span>
              )}
            </div>

            <div className="kpi-accent-bottom-bar" />
          </div>
        );
      })}
    </section>
  );
}
