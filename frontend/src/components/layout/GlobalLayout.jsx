import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClinic } from '../../contexts/ClinicContext';
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
    { label: 'Settings', path: '/admin/config' },
  ],
  doctor: [
    { label: 'Doctor Desk', path: '/doctor/queue' },
    { label: 'Registration', path: '/reception/register' },
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Medicine Master', path: '/admin/medicines' },
    { label: 'Home', path: '/' },
  ],
  reception: [
    { label: 'Registration', path: '/reception/register' },
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Home', path: '/' },
  ],
  pharmacy: [
    { label: 'Pharmacy', path: '/pharmacy' },
    { label: 'Medicine Master', path: '/admin/medicines' },
    { label: 'Home', path: '/' },
  ],
  lab: [
    { label: 'Laboratory', path: '/lab/tests' },
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

          {/* Role-Based Navigation Links */}
          <nav className="header-nav-links" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isHome = item.path === '/';
              const isActive = isHome
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={`nav-pill-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-pill-text">{item.label}</span>
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
