import React, { useState, useEffect, useCallback } from 'react';
import { visitService } from '../../services/visitService';
import TopNavigation from '../../components/navigation/TopNavigation';
import DashboardKPIs from '../../components/doctor/DashboardKPIs';
import PatientQueueTable from '../../components/doctor/PatientQueueTable';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      total_patients: 0,
      waiting: 0,
      followup: 0,
      reports_pending: 0,
      not_attended: 0,
      completed: 0,
    },
    queue: [],
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  });

  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');

  // Fetch Dashboard data from backend
  const fetchDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMessage('');

    try {
      const data = await visitService.getDoctorDashboard(selectedConsultant);
      if (data && typeof data === 'object') {
        setDashboardData({
          kpis: data.kpis || {
            total_patients: 0,
            waiting: 0,
            followup: 0,
            reports_pending: 0,
            not_attended: 0,
            completed: 0,
          },
          queue: Array.isArray(data.queue) ? data.queue : [],
          date: data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        });
      }
    } catch (err) {
      console.error('Failed to fetch doctor dashboard:', err);
      // Graceful error state without white screen crash
      setErrorMessage('Unable to connect to clinic server. Displaying cached records.');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [selectedConsultant]);

  // Polling interval every 10 seconds for real-time queue updates
  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      fetchDashboard(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return (
    <div className="doctor-dashboard-layout">
      {/* 1. Top Navigation Bar */}
      <TopNavigation />

      {/* Main Dashboard Workspace */}
      <main className="doctor-dashboard-main">
        <div className="dashboard-content-max">
          {/* Header Action Bar */}
          <div className="dashboard-subheader-row">
            <div className="subheader-left">
              <h1 className="dashboard-page-title">Doctor Consultation Desk</h1>
              <span className="dashboard-live-date-pill">
                <svg className="w-3.5 h-3.5 inline mr-1 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {dashboardData.date}
              </span>
            </div>

            <div className="subheader-right">
              {/* Consultant Assigned Filter */}
              <select
                className="consultant-filter-select"
                value={selectedConsultant}
                onChange={(e) => setSelectedConsultant(e.target.value)}
                aria-label="Filter by Consultant"
              >
                <option value="">All Consultants</option>
                <option value="Dr. T.S.Jeyagowthaman">Dr. T.S.Jeyagowthaman</option>
                <option value="Dr. Tamil Iniyan">Dr. Tamil Iniyan</option>
                <option value="Dr. Anuradha">Dr. Anuradha</option>
                <option value="Dr. A.K.K.Shanmugaranman">Dr. A.K.K.Shanmugaranman</option>
                <option value="Staff nurse">Staff nurse</option>
              </select>

              {/* Refresh Button */}
              <button
                type="button"
                className={`btn-refresh-dashboard ${refreshing ? 'loading' : ''}`}
                onClick={() => fetchDashboard(true)}
                title="Refresh queue"
              >
                <svg className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{refreshing ? 'Refreshing...' : 'Live Sync'}</span>
              </button>
            </div>
          </div>

          {/* Graceful Error Toast Banner */}
          {errorMessage && (
            <div className="dashboard-error-banner" role="alert" data-testid="dashboard-error-banner">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="error-banner-text">
                <strong>System Notice:</strong> {errorMessage}
              </div>
              <button
                type="button"
                className="btn-dismiss-error"
                onClick={() => setErrorMessage('')}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* 2. Compact 6-Column KPIs Grid */}
          <DashboardKPIs
            kpis={dashboardData.kpis}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            loading={loading}
          />

          {/* 3. Dense Patient Queue Table */}
          <PatientQueueTable
            patients={dashboardData.queue}
            loading={loading}
            activeFilter={activeFilter}
          />
        </div>
      </main>
    </div>
  );
}
