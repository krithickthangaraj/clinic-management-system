import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

export default function HospitalProfileTab({ onToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hospital_name: '',
    tagline: '',
    registration_number: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    logo_url: '',
  });

  useEffect(() => {
    loadHospitalSettings();
  }, []);

  const loadHospitalSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getHospital();
      setFormData({
        hospital_name: data.hospital_name || '',
        tagline: data.tagline || '',
        registration_number: data.registration_number || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        address: data.address || '',
        logo_url: data.logo_url || '',
      });
    } catch (err) {
      console.error('Failed to load hospital settings:', err);
      onToast('error', 'Failed to load hospital settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await settingsService.updateHospital(formData);
      setFormData((prev) => ({ ...prev, ...updated }));
      onToast('success', 'Hospital details and print letterhead updated successfully.');
    } catch (err) {
      console.error('Save failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to update hospital settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Loading hospital details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Hospital &amp; Clinic Letterhead</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global branding, registration, and contact information. These details automatically feed into all printable Prescriptions, Diagnostic Reports, and Bills.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 8 Cols */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Facility Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Clinic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="hospital_name"
                  required
                  value={formData.hospital_name}
                  onChange={handleChange}
                  placeholder="e.g. AEREN CLINIC & HEALTHCARE"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-semibold text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Excellence in Outpatient Healthcare & Diagnostics"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration / NABH License #
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="e.g. REG-TN-2024-8849"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Contact Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@aerenclinic.com"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="e.g. www.aerenclinic.com"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 123 Medical Center Road, Central Healthcare District, Chennai - 600001"
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Print Header Preview: 4 Cols */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                Live Letterhead Preview
              </h3>
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white mx-auto flex items-center justify-center font-bold text-xs mb-2">
                  ✚
                </div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  {formData.hospital_name || 'HOSPITAL NAME'}
                </h4>
                <p className="text-[11px] text-teal-700 font-medium italic">
                  {formData.tagline || 'Clinic Tagline'}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight pt-1">
                  {formData.address || 'Hospital Address, City, Pincode'}
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  Ph: {formData.phone || '+91 XXXXX XXXXX'} &bull; {formData.email || 'email@clinic.com'}
                </p>
                {formData.registration_number && (
                  <span className="inline-block mt-1 text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                    Reg: {formData.registration_number}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Matches the top banner on A4 Prescriptions &amp; OPD Receipts
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save Hospital Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
