import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClinic } from '../../contexts/ClinicContext';
import { visitService } from '../../services/visitService';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const clinic = useClinic();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState({
    total_patients: 0,
    waiting: 0,
    completed: 0,
    reports_pending: 0,
  });
  const [loading, setLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.full_name || (user?.role === 'doctor' ? 'Doctor' : user?.role);
  const userRole = user?.role?.toLowerCase() || 'doctor';

  useEffect(() => {
    let isMounted = true;
    visitService
      .getDoctorDashboard()
      .then((res) => {
        if (isMounted && res?.kpis) {
          setDashboardStats({
            total_patients: res.kpis.total_patients || 0,
            waiting: res.kpis.waiting || 0,
            completed: res.kpis.completed || 0,
            reports_pending: res.kpis.reports_pending || 0,
          });
        }
      })
      .catch(() => {
        // Safe fallback
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Quick action cards configured by role
  const getRoleActions = () => {
    switch (userRole) {
      case 'doctor':
        return [
          {
            title: 'Doctor Desk (Live Queue)',
            desc: 'View scheduled patients, check clinical vitals, and conduct consultations.',
            path: '/doctor/queue',
            badge: `${dashboardStats.waiting} Waiting`,
            badgeClass: 'badge-waiting',
            actionText: 'Open Queue Desk',
            isPrimary: true,
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            ),
          },
          {
            title: 'Patient Registration & Vitals',
            desc: 'Quickly register walk-in patients and record baseline vitals.',
            path: '/reception/register',
            actionText: 'Register Patient',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
            ),
          },
          {
            title: 'Clinical Templates',
            desc: 'Configure and customize standardized prescription advice and drug templates.',
            path: '/doctor/template/new',
            actionText: 'Manage Templates',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ),
          },
        ];

      case 'reception':
        return [
          {
            title: 'New Patient Registration & Vitals',
            desc: 'Register incoming outpatients, capture metrics, and auto-assign barcodes.',
            path: '/reception/register',
            actionText: 'Start Registration',
            isPrimary: true,
            badge: 'Direct Entry',
            badgeClass: 'badge-reception',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            ),
          },
          {
            title: "Today's Patient Queue",
            desc: 'Monitor checked-in patients, vitals status, and routing to doctor chambers.',
            path: '/doctor/queue',
            badge: `${dashboardStats.total_patients} Today`,
            badgeClass: 'badge-total',
            actionText: 'View Queue',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 8h10M7 12h10M7 16h6" />
              </svg>
            ),
          },
        ];

      case 'lab':
        return [
          {
            title: 'Pending Laboratory Tests',
            desc: 'Review doctor test orders, enter clinical metrics, and generate lab reports.',
            path: '/lab/tests',
            isPrimary: true,
            actionText: 'Open Laboratory Desk',
            badge: `${dashboardStats.reports_pending} Pending`,
            badgeClass: 'badge-reports',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                <path d="M5.52 16h12.96" />
              </svg>
            ),
          },
        ];

      case 'admin':
      default:
        return [
          {
            title: 'Doctor Desk & Consultation',
            desc: 'Queue manager, doctor consultations, prescriptions, and digital test orders.',
            path: '/doctor/queue',
            isPrimary: true,
            badge: `${dashboardStats.waiting} Waiting`,
            badgeClass: 'badge-waiting',
            actionText: 'Doctor Desk',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            ),
          },
          {
            title: 'Patient Registration & Vitals',
            desc: 'Register outpatients, verify demographics, barcodes, and clinical vitals.',
            path: '/reception/register',
            actionText: 'Reception Desk',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            title: 'Laboratory Investigations',
            desc: 'Manage test requests, lab values, and diagnostic investigations.',
            path: '/lab/tests',
            actionText: 'Laboratory',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                <path d="M5.52 16h12.96" />
              </svg>
            ),
          },
          {
            title: 'Pharmacy & Drug Master',
            desc: 'Configure medicines, dosages, trade brands, and inventory catalog.',
            path: '/admin/medicines',
            actionText: 'Pharmacy Catalog',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            ),
          },
          {
            title: 'System Settings & Clinic Profile',
            desc: 'Hospital header settings, print formats, and master libraries.',
            path: '/admin/config',
            actionText: 'Settings',
            icon: (
              <svg className="action-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ),
          },
        ];
    }
  };

  const actionCards = getRoleActions();

  return (
    <div className="home-dashboard-page">
      <div className="home-content-container">
        {/* Welcome Banner */}
        <section className="home-welcome-hero">
          <div className="hero-left-content">
            <h1 className="hero-greeting-title">
              {getGreeting()}, {displayName}!
            </h1>
            <p className="hero-greeting-desc">
              Welcome to the {clinic?.clinicName || 'Hospital Management System'}. Here is your operational overview for today.
            </p>
          </div>

          <div className="hero-right-meta">
            <span className="live-date-indicator">
              <svg className="w-4 h-4 text-slate-500 mr-1.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </section>

        {/* Live Daily Activity Metrics */}
        <section className="home-metrics-bar" aria-label="Today Activity Summary">
          <div className="metric-item-box">
            <span className="metric-box-label">TOTAL PATIENTS</span>
            <span className="metric-box-number">{loading ? '—' : dashboardStats.total_patients}</span>
          </div>
          <div className="metric-item-box">
            <span className="metric-box-label">WAITING IN QUEUE</span>
            <span className="metric-box-number text-blue-600">{loading ? '—' : dashboardStats.waiting}</span>
          </div>
          <div className="metric-item-box">
            <span className="metric-box-label">COMPLETED</span>
            <span className="metric-box-number text-emerald-600">{loading ? '—' : dashboardStats.completed}</span>
          </div>
          <div className="metric-item-box">
            <span className="metric-box-label">PENDING LAB TESTS</span>
            <span className="metric-box-number text-amber-600">{loading ? '—' : dashboardStats.reports_pending}</span>
          </div>
        </section>

        {/* Quick-Action Role Cards Grid */}
        <section className="home-actions-section">
          <h2 className="section-header-title">Quick Actions &amp; Workspaces</h2>

          <div className="action-cards-grid">
            {actionCards.map((card) => (
              <div
                key={card.title}
                className={`action-workspace-card ${card.isPrimary ? 'is-primary-card' : ''}`}
                onClick={() => navigate(card.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
              >
                <div className="card-top-row">
                  <div className="card-icon-frame">{card.icon}</div>
                  {card.badge && (
                    <span className={`card-status-badge ${card.badgeClass || ''}`}>
                      {card.badge}
                    </span>
                  )}
                </div>

                <div className="card-mid-content">
                  <h3 className="card-title-text">{card.title}</h3>
                  <p className="card-desc-text">{card.desc}</p>
                </div>

                <div className="card-bottom-action">
                  <span className="card-action-label">{card.actionText}</span>
                  <svg className="card-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
