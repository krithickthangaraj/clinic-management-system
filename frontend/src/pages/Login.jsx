import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settingsService';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Dynamically fetch Hospital Branding from HospitalSettings
    settingsService
      .getHospital()
      .then((data) => setHospitalInfo(data))
      .catch(() => {
        // Fallback silently if unauthenticated
      });
  }, []);

  const getRoleRedirectPath = (role) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return '/doctor/queue';
      case 'reception':
      case 'receptionist':
        return '/reception/register';
      case 'pharmacy':
      case 'pharmacist':
        return '/pharmacy';
      case 'lab':
      case 'lab_tech':
        return '/lab/tests';
      case 'admin':
        return '/reports';
      default:
        return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username.trim(), password);
      const userRole = response?.user?.role || response?.role;
      const redirectPath = getRoleRedirectPath(userRole);
      navigate(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail ||
          'Invalid username or password. Please verify your credentials.'
      );
      setLoading(false);
    }
  };

  const fillQuickCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: Brand Display & Hospital Showcase (Hidden on Mobile)       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-950 flex-col justify-between p-12 lg:p-16 text-white relative overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* Top: Hospital Identity */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-teal-600/30 text-white shrink-0">
              {hospitalInfo?.logo_url ? (
                <img
                  src={hospitalInfo.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase">
                {hospitalInfo?.hospital_name || 'KONGU HOSPITAL'}
              </h2>
              <p className="text-xs text-teal-400 font-medium">
                {hospitalInfo?.address || '4 ROADS, VEPPADAI, KOMARAPALAYAM, NAMAKKAL - 638008.'}
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Doctor Profile & Capability Highlights */}
        <div className="relative z-10 my-auto py-6 space-y-6">
          {/* Consultant Physician Profile Card */}
          <div className="p-4 bg-slate-900/90 border border-teal-500/30 rounded-2xl shadow-md space-y-2 max-w-md">
            <div className="flex items-center justify-between">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full">
                Lead Consultant
              </span>
              <span className="text-[11px] font-mono font-bold text-teal-400">
                REG NO: 82047
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight">
                DR. T.S.JEYAGOWTHAMAN M.D., D.DIAB.
              </h3>
              <p className="text-xs text-teal-300 font-semibold uppercase tracking-wide">
                CONSULTANT PHYSICIAN AND DIABETOLOGIST
              </p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              Specialized in Advanced Diabetes Care, Internal Medicine, Comprehensive OPD Consultations &amp; Diagnostics.
            </p>
          </div>

          <div className="space-y-2 max-w-md">
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight leading-snug">
              Integrated Clinical Management &amp; Patient Care
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time patient queueing, instant digital prescriptions, smart pharmacy dispensing, and laboratory investigation management.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-w-md">
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-0.5">
              <div className="text-xs font-bold text-slate-200">Doctor Desk</div>
              <div className="text-[10px] text-slate-400">Smart RX &amp; Clinical Notes</div>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-0.5">
              <div className="text-xs font-bold text-slate-200">Pharmacy POS</div>
              <div className="text-[10px] text-slate-400">Real-Time Inventory Master</div>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-0.5">
              <div className="text-xs font-bold text-slate-200">Diagnostic Lab</div>
              <div className="text-[10px] text-slate-400">Sync &amp; Report Generation</div>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-0.5">
              <div className="text-xs font-bold text-slate-200">OPD Census</div>
              <div className="text-[10px] text-slate-400">Daily Register &amp; Printouts</div>
            </div>
          </div>
        </div>

        {/* Bottom: Facility Contact & Sign-off */}
        <div className="relative z-10 border-t border-slate-800/80 pt-5 space-y-1.5 text-xs text-slate-400">
          <p className="italic text-slate-300 font-medium">
            &ldquo;Excellence in outpatient healthcare, diabetes management, and precision clinical diagnostics.&rdquo;
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>4 ROADS, VEPPADAI, KOMARAPALAYAM, NAMAKKAL - 638008.</span>
            <span className="font-mono text-teal-400 font-bold">REG: 82047</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT PANEL: Login Form & Authentication Container                     */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50/50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80">
          {/* Mobile Top Brand (Visible only on < lg screens) */}
          <div className="lg:hidden text-center space-y-1 pb-2">
            <div className="w-10 h-10 bg-teal-700 text-white rounded-lg mx-auto flex items-center justify-center font-bold text-lg shadow-sm">
              ✚
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {hospitalInfo?.hospital_name || 'KONGU HOSPITAL'}
            </h2>
            <p className="text-[11px] text-teal-700 font-semibold">
              DR. T.S.JEYAGOWTHAMAN M.D., D.DIAB.
            </p>
            <p className="text-[10px] text-slate-500">
              4 Roads, Veppadai, Komarapalayam - 638008
            </p>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500">
              Enter your clinical credentials to access your workspace.
            </p>
          </div>

          {/* Inline Error Banner */}
          {error && (
            <div
              className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
              role="alert"
              data-testid="login-error-banner"
            >
              <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Username / Staff ID
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="e.g. dr_ramesh or reception"
                  className="w-full h-10 pl-9 pr-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-medium text-slate-900"
                  data-testid="input-username"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full h-10 pl-9 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all font-medium text-slate-900"
                  data-testid="input-password"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  data-testid="btn-toggle-password"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 mt-2"
              data-testid="btn-submit-login"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-teal-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to System</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center lg:text-left">
              Quick Demo Access
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('doctor', 'doctor123')}
                className="py-1.5 px-2 text-[10px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/60 rounded-md text-center transition-colors cursor-pointer"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('reception', 'reception123')}
                className="py-1.5 px-2 text-[10px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/60 rounded-md text-center transition-colors cursor-pointer"
              >
                Reception
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin', 'admin123')}
                className="py-1.5 px-2 text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60 rounded-md text-center transition-colors cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Security Footer Note */}
          <div className="text-center pt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>256-Bit Encrypted &bull; HIPAA &amp; NABH Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
