import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../contexts/AuthContext';

export default function MyProfileTab({ onToast }) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getProfile();
      setProfile(data);
      setProfileForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      onToast('error', 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await settingsService.updateProfile(profileForm);
      setProfile(updated);
      onToast('success', 'Personal contact details updated successfully.');
    } catch (err) {
      console.error('Update profile failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      onToast('error', 'New password and confirmation do not match.');
      return;
    }
    if (passwordForm.new_password.length < 4) {
      onToast('error', 'New password must be at least 4 characters long.');
      return;
    }
    try {
      setSavingPassword(true);
      await settingsService.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      onToast('success', 'Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error('Change password failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to change password. Check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading user profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / User Badge */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold shadow-xs">
            {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{profile?.full_name}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                {profile?.role}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Username: <strong className="text-slate-700 font-mono">@{profile?.username}</strong></span>
              {profile?.department && (
                <>
                  <span>&bull;</span>
                  <span>Dept: <strong className="text-slate-700">{profile?.department}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Edit Contact Info */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Personal &amp; Contact Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="e.g. user@clinic.com"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {savingProfile ? 'Updating...' : 'Update Contact Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Change Password
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Min 4 characters"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {savingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
