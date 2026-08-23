import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

export default function StaffManagementTab({ onToast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'doctor',
    email: '',
    phone: '',
    department: '',
    qualification: '',
  });

  useEffect(() => {
    loadStaff();
  }, [roleFilter]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      const data = await settingsService.listStaff(params);
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
      onToast('error', 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await settingsService.createStaff(formData);
      onToast('success', `Staff member ${formData.full_name} created successfully.`);
      setShowAddModal(false);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'doctor',
        email: '',
        phone: '',
        department: '',
        qualification: '',
      });
      loadStaff();
    } catch (err) {
      console.error('Create staff failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await settingsService.updateStaff(editingStaff.id, {
        full_name: editingStaff.full_name,
        role: editingStaff.role,
        email: editingStaff.email,
        phone: editingStaff.phone,
        department: editingStaff.department,
        qualification: editingStaff.qualification,
      });
      onToast('success', `Staff member ${editingStaff.full_name} updated successfully.`);
      setEditingStaff(null);
      loadStaff();
    } catch (err) {
      console.error('Update staff failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to update staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const updated = await settingsService.toggleStaffStatus(user.id);
      onToast('success', `User ${user.username} is now ${updated.is_active ? 'Active' : 'Deactivated'}.`);
      setStaffList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: updated.is_active } : u))
      );
    } catch (err) {
      console.error('Toggle status failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to change user status.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      onToast('error', 'Password must be at least 4 characters long.');
      return;
    }
    try {
      setSubmitting(true);
      await settingsService.resetStaffPassword(resettingUser.id, newPassword);
      onToast('success', `Password reset successfully for ${resettingUser.username}.`);
      setResettingUser(null);
      setNewPassword('');
    } catch (err) {
      console.error('Reset password failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (user.full_name && user.full_name.toLowerCase().includes(q)) ||
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.department && user.department.toLowerCase().includes(q)) ||
      (user.role && user.role.toLowerCase().includes(q))
    );
  });

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'admin':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'reception':
      case 'receptionist':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'pharmacy':
      case 'pharmacist':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'lab':
      case 'lab_tech':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky Action Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative w-64 sm:w-72">
            <input
              type="text"
              placeholder="Search staff name, role, dept..."
              className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Role Filter */}
          <select
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="reception">Receptionists</option>
            <option value="pharmacy">Pharmacists</option>
            <option value="lab">Lab Technicians</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="h-9 px-4.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Add New Staff</span>
        </button>
      </div>

      {/* Staff Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department &amp; Qual.</th>
                <th className="py-3 px-3">Contact Info</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                          {user.full_name?.charAt(0) || user.username?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{user.department || '—'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{user.qualification || ''}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{user.phone || '—'}</div>
                      <div className="text-[10px] text-slate-400">{user.email || '—'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span>{user.is_active ? 'Active' : 'Deactivated'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStaff(user)}
                          className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-md transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResettingUser(user);
                            setNewPassword('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Reset Pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: ADD NEW STAFF --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register New Staff Member</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Dr. K. Ramesh"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. dr_ramesh"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Temporary password"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold text-slate-800"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="reception">Receptionist</option>
                    <option value="pharmacy">Pharmacist</option>
                    <option value="lab">Lab Technician</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. General Medicine"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. staff@aerenclinic.com"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT STAFF --- */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Staff: {editingStaff.full_name}</h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.full_name || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold text-slate-800"
                    value={editingStaff.role || 'doctor'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="reception">Receptionist</option>
                    <option value="pharmacy">Pharmacist</option>
                    <option value="lab">Lab Technician</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editingStaff.department || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editingStaff.qualification || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, qualification: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADMIN PASSWORD RESET --- */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reset Password: @{resettingUser.username}</h3>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
