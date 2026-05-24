import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { visitService } from '../services/visitService';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [queueCount, setQueueCount] = useState(null);

  useEffect(() => {
    if (user?.role === 'doctor' || user?.role === 'admin') {
      visitService
        .getQueue()
        .then((d) => setQueueCount(Array.isArray(d) ? d.length : 0))
        .catch(() => setQueueCount(0));
    }
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleRoutes = () => {
    switch (user?.role) {
      case 'reception':
        return [
          {
            path: '/reception/register',
            label: 'Register & Vitals',
            icon: '👤',
            color: '#0f766e',
            desc: 'New patient and vitals on one page',
          },
        ];
      case 'doctor':
        return [
          {
            path: '/doctor/queue',
            label: 'Patient Queue',
            icon: '👥',
            color: '#2563eb',
            desc: 'See and consult waiting patients',
            badge: queueCount != null ? queueCount : null,
          },
        ];
      case 'lab':
        return [
          {
            path: '/lab/tests',
            label: 'Pending Tests',
            icon: '🧪',
            color: '#7c3aed',
            desc: 'Enter and manage test results',
          },
        ];
      case 'admin':
        return [
          {
            path: '/reception/register',
            label: 'Reception',
            icon: '👤',
            color: '#0f766e',
            desc: 'Register patients & vitals',
          },
          {
            path: '/doctor/queue',
            label: 'Doctor',
            icon: '👥',
            color: '#2563eb',
            desc: 'Patient queue',
            badge: queueCount != null ? queueCount : null,
          },
          {
            path: '/lab/tests',
            label: 'Lab',
            icon: '🧪',
            color: '#7c3aed',
            desc: 'Pending tests',
          },
          {
            path: '/admin/config',
            label: 'Admin Config',
            icon: '⚙️',
            color: '#0f766e',
            desc: 'Clinic profile and libraries',
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, {user?.full_name?.split(' ')[0] || user?.role}!</h2>
          <p>
            {(user?.role === 'admin' && 'Manage reception, doctor and lab.') ||
              (user?.role === 'doctor' && 'Your queue and consultations.') ||
              (user?.role === 'reception' &&
                'Register patients and enter vitals.') ||
              'What would you like to do?'}
          </p>
        </div>

        <div className="quick-grid">
          {getRoleRoutes().map((route) => (
            <div
              key={route.path}
              className="dashboard-card"
              onClick={() => navigate(route.path)}
              style={{ '--accent-color': route.color }}
            >
              <div className="card-icon">{route.icon}</div>
              <div className="card-content">
                <h3>
                  {route.label}
                  {route.badge != null && (
                    <span className="card-badge">{route.badge}</span>
                  )}
                </h3>
                <p>{route.desc || 'Open'}</p>
              </div>
              <div className="card-arrow">→</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={handleLogout} className="btn-back">
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
