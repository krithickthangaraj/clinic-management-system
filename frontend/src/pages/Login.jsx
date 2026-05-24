import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalHeader from '../components/GlobalHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const clinic = useClinic();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Login failed. Please check your credentials.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <GlobalHeader />
      <div className="login-wrapper" style={{ marginTop: clinic.headerHeight }}>
        {/* LEFT COLUMN: Clinic Info */}
        <div className="login-left">
          <div className="clinic-banner">
            <div className="clinic-logo-large">{clinic.clinicLogoUrl}</div>
            <h2 className="clinic-title">{clinic.clinicName}</h2>
            <p className="clinic-detail">{clinic.clinicAddress}</p>
            <div className="clinic-divider"></div>
            <div className="clinic-footer">
              <p className="doctor-name-banner">{clinic.doctorName}</p>
              <p className="doctor-quals-banner">
                {clinic.doctorQualifications}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="login-right">
          <div className="login-card">
            <h1>Sign In</h1>
            <p className="subtitle">Access your clinic account</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="login-footer">Secure clinic management system</p>
          </div>
        </div>
      </div>
    </div>
  );
}
