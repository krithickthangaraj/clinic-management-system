import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClinic } from '../../contexts/ClinicContext';

const NAV_ITEMS = [
  { label: 'HOME', path: '/' },
  { label: 'REGISTRATION', path: '/reception/register' },
  { label: 'DOCTOR DESK', path: '/doctor/queue' },
  { label: 'LABORATORY', path: '/lab/tests' },
  { label: 'PHARMACY', path: '/admin/medicines' },
  { label: 'REPORTS', path: '/admin/config' },
  { label: 'CERTIFICATES', path: '/admin/config' },
  { label: 'SETTINGS', path: '/admin/config' },
];

export default function TopNavigation() {
  const { user, logout } = useAuth();
  const { config } = useClinic();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clinicName = config?.name || 'V.K. CARE & CURE CLINIC';

  return (
    <header className="doctor-top-navbar">
      <div className="navbar-container">
        {/* Brand & Clinic Title */}
        <div className="navbar-brand-section" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <div className="brand-logo-mark">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div className="brand-titles">
            <span className="clinic-main-name">{clinicName}</span>
            <span className="clinic-sub-name">Outpatient Medical Suite</span>
          </div>
        </div>

        {/* Horizontal Navigation Menu */}
        <nav className="navbar-menu-items" role="navigation" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive: linkActive }) =>
                  `nav-menu-link ${linkActive || isActive ? 'active' : ''}`
                }
              >
                <span className="nav-menu-text">{item.label}</span>
                {(isActive) && <span className="nav-active-indicator" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User Identity & Logout Button */}
        <div className="navbar-user-actions">
          <div className="doctor-profile-badge">
            <div className="doctor-avatar-circle">
              <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="doctor-info-text">
              <span className="doctor-name-display">{user?.full_name || 'Dr. Jeyagowthaman'}</span>
              <span className="doctor-role-display">{user?.role?.toUpperCase() || 'DOCTOR'}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-nav-logout"
            onClick={handleLogout}
            title="Log out of system"
          >
            <svg className="w-4 h-4 mr-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>LOGOUT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
