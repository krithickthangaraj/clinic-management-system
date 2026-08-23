import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { visitService } from '../../services/visitService';
import DoctorDeskHeader from '../../components/doctor/DoctorDeskHeader';
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

  // State Management for Interactive Filters
  const [activeKpiFilter, setActiveKpiFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'routine' | 'emergency' | 'follow-up'
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      // Graceful error boundary notice without crashing
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

  // Real-time category count computations for the Segmented Control pills
  const categoryCounts = useMemo(() => {
    const q = dashboardData.queue || [];
    let countRoutine = 0;
    let countEmergency = 0;
    let countFollowup = 0;
    let countPendingLab = 0;

    q.forEach((item) => {
      const c = String(item.category || '').toLowerCase();
      const s = String(item.status || '').toLowerCase();
      if (s === 'reports_pending' || s === 'reports_ready' || item.lab_results_ready) {
        countPendingLab++;
      }
      if (c.includes('emergen')) {
        countEmergency++;
      } else if (c.includes('follow')) {
        countFollowup++;
      } else {
        countRoutine++;
      }
    });

    return {
      all: q.length,
      routine: countRoutine,
      emergency: countEmergency,
      'follow-up': countFollowup,
      'pending-lab': countPendingLab,
    };
  }, [dashboardData.queue]);

  const handleResetFilters = () => {
    setActiveKpiFilter('all');
    setSelectedCategory('all');
  };

  return (
    <div className="doctor-dashboard-layout">
      <main className="doctor-dashboard-main">
        <div className="dashboard-content-max">
          {/* 1. Sleek, Compact Doctor Desk Header (Title, Calendar Date, All Consultants, Live Sync) */}
          <DoctorDeskHeader
            date={dashboardData.date}
            selectedConsultant={selectedConsultant}
            onConsultantChange={setSelectedConsultant}
            refreshing={refreshing}
            onRefresh={() => fetchDashboard(true)}
          />

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

          {/* 2. Compact 6-Column KPI Grid */}
          <DashboardKPIs
            kpis={dashboardData.kpis}
            activeFilter={activeKpiFilter}
            onFilterChange={setActiveKpiFilter}
            loading={loading}
          />

          {/* 3. Dense Patient Queue Table with Category Filter Tabs & Search */}
          <PatientQueueTable
            patients={dashboardData.queue}
            loading={loading}
            activeKpiFilter={activeKpiFilter}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryCounts={categoryCounts}
            onResetFilters={handleResetFilters}
          />
        </div>
      </main>
    </div>
  );
}
