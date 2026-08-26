import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClinic } from '../../contexts/ClinicContext';
import { visitService } from '../../services/visitService';
import { pharmacyService } from '../../services/pharmacyService';
import { labService } from '../../services/labService';
import './GlobalLayout.css';

// RBAC Navigation Configuration
const ROLE_NAV_CONFIG = {
  admin: [
    { label: 'Home', path: '/' },
    { label: 'Registration', path: '/reception/register' },
    { label: 'Doctor Desk', path: '/doctor/queue' },
    { label: 'Laboratory', path: '/lab/tests' },
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Medicine Master', path: '/admin/medicines' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ],
  doctor: [
    { label: 'Doctor Desk', path: '/doctor/queue' },
    { label: 'Registration', path: '/reception/register' },
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Medicine Master', path: '/admin/medicines' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
    { label: 'Home', path: '/' },
  ],
  reception: [
    { label: 'Registration', path: '/reception/register' },
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
    { label: 'Home', path: '/' },
  ],
  pharmacy: [
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Medicine Master', path: '/admin/medicines' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
    { label: 'Home', path: '/' },
  ],
  lab: [
    { label: 'Laboratory', path: '/lab/tests' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
    { label: 'Home', path: '/' },
  ],
};



export default function GlobalLayout({ children }) {
  const { user, logout } = useAuth();
  const clinic = useClinic();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role?.toLowerCase() || 'doctor';
  const navItems = ROLE_NAV_CONFIG[userRole] || ROLE_NAV_CONFIG.doctor;

  const hospitalName =
    clinic?.clinicName ||
    clinic?.config?.name ||
    'HOSPITAL MANAGEMENT SYSTEM';

  // Live Queue Counts & Acknowledged State
  const [counts, setCounts] = useState({
    doctor: 0,
    pharmacy: 0,
    lab: 0,
    reception: 0,
  });

  const [acknowledged, setAcknowledged] = useState({});

  const fetchLiveCounts = useCallback(async () => {
    try {
      const [docData, pharmData, labData, recData] = await Promise.allSettled([
        visitService.getDoctorToday(),
        pharmacyService.getQueue(),
        labService.getQueue(),
        visitService.getReceptionToday(),
      ]);

      let docCount = 0;
      if (docData.status === 'fulfilled' && Array.isArray(docData.value)) {
        docCount = docData.value.filter(
          (v) =>
            v.status === 'vitals_done' ||
            v.status === 'in_consultation' ||
            v.status === 'pending'
        ).length;
      }

      let pharmCount = 0;
      if (pharmData.status === 'fulfilled' && Array.isArray(pharmData.value)) {
        pharmCount = pharmData.value.filter(
          (q) => String(q.pharmacy_status || q.status || '').toLowerCase() !== 'dispensed'
        ).length;
      }

      let labCount = 0;
      if (labData.status === 'fulfilled' && Array.isArray(labData.value)) {
        labCount = labData.value.filter(
          (l) => String(l.status || '').toLowerCase() !== 'completed'
        ).length;
      }

      let recCount = 0;
      if (recData.status === 'fulfilled' && Array.isArray(recData.value)) {
        recCount = recData.value.filter(
          (r) => r.status === 'registered' || r.status === 'vitals_pending' || r.status === 'in_queue'
        ).length;
      }

      setCounts({
        doctor: docCount,
        pharmacy: pharmCount,
        lab: labCount,
        reception: recCount,
      });
    } catch {
      // Non-blocking background polling
    }
  }, []);

  useEffect(() => {
    fetchLiveCounts();
    const interval = setInterval(fetchLiveCounts, 12000);
    return () => clearInterval(interval);
  }, [fetchLiveCounts]);

  // When user opens/navigates to a tab, dismiss alert for that tab immediately
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/doctor')) {
      setAcknowledged((prev) => ({ ...prev, '/doctor/queue': counts.doctor }));
    } else if (currentPath.startsWith('/pharmacy')) {
      setAcknowledged((prev) => ({ ...prev, '/pharmacy': counts.pharmacy }));
    } else if (currentPath.startsWith('/lab')) {
      setAcknowledged((prev) => ({ ...prev, '/lab/tests': counts.lab }));
    } else if (currentPath.startsWith('/reception')) {
      setAcknowledged((prev) => ({ ...prev, '/reception/register': counts.reception }));
    }
  }, [location.pathname, counts]);

  // Inactivity detection: after 45s of user idle, re-arm alerts so pending queues catch attention
  useEffect(() => {
    let idleTimer;
    const handleActivity = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setAcknowledged({});
      }, 45000);
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    handleActivity();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  const handleTabClick = (path) => {
    let currentCount = 0;
    if (path === '/doctor/queue') currentCount = counts.doctor;
    else if (path === '/pharmacy') currentCount = counts.pharmacy;
    else if (path === '/lab/tests') currentCount = counts.lab;
    else if (path === '/reception/register') currentCount = counts.reception;

    setAcknowledged((prev) => ({ ...prev, [path]: currentCount }));
  };

  const hasUnviewedAlert = (path) => {
    const isCurrentActive =
      path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path);

    if (isCurrentActive) return false;

    let currentCount = 0;
    if (path === '/doctor/queue') currentCount = counts.doctor;
    else if (path === '/pharmacy') currentCount = counts.pharmacy;
    else if (path === '/lab/tests') currentCount = counts.lab;
    else if (path === '/reception/register') currentCount = counts.reception;

    if (currentCount <= 0) return false;
    const lastAck = acknowledged[path] ?? 0;
    return currentCount > lastAck;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="global-app-container">
      {/* 1. Next-Gen Persistent Header */}
      <header className="global-sticky-header" role="banner">
        <div className="header-inner-shell">
          {/* Brand & Hospital Name */}
          <div
            className="brand-identity-block"
            onClick={() => navigate('/')}
            role="button"
            tabIndex={0}
            title="Return to Home"
          >
            <div className="hospital-mark-icon">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div className="hospital-brand-titles">
              <span className="hospital-title-main">{hospitalName}</span>
              <span className="hospital-tagline">Clinical Enterprise Suite</span>
            </div>
          </div>

          {/* Role-Based Navigation Links with Green Blinking Beacon & Flowing Border Alerts */}
          <nav className="header-nav-links" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isHome = item.path === '/';
              const isActive = isHome
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              const hasAlert = hasUnviewedAlert(item.path);

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={() => handleTabClick(item.path)}
                  className={`nav-pill-link ${isActive ? 'active' : ''} ${
                    hasAlert ? 'has-new-alert' : ''
                  }`}
                >
                  <span className="nav-pill-text">{item.label}</span>
                  {hasAlert && (
                    <span className="nav-beacon-container" title="New entry waiting">
                      <span className="nav-beacon-ping" />
                      <span className="nav-beacon-dot" />
                    </span>
                  )}
                  {isActive && <span className="nav-pill-underline" />}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="header-user-tray">
            <div className="user-profile-badge">
              <div className="user-avatar-disc">
                <svg
                  className="w-3.5 h-3.5 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="user-meta-lines">
                <span className="user-display-name">
                  {user?.full_name || 'Medical Officer'}
                </span>
                <span className={`user-role-chip role-${userRole}`}>
                  {userRole.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-header-logout"
              onClick={handleLogout}
              title="Sign Out"
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Content Outlet */}
      <main className="global-main-viewport">
        {children}
      </main>
    </div>
  );
}
