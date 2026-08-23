import React, { useState, useEffect } from 'react';
import { reportsService } from '../../services/reportsService';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../contexts/AuthContext';

export default function DocumentGenerationTab({ onToast }) {
  const { user } = useAuth();
  const [selectedDocType, setSelectedDocType] = useState('daily_op'); // 'daily_op' | 'referral' | 'leave_letter'
  const [hospitalInfo, setHospitalInfo] = useState(null);

  // --- 1. DAILY OP STATE ---
  const [opDate, setOpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [opReport, setOpReport] = useState(null);
  const [loadingOP, setLoadingOP] = useState(false);

  // --- 2. REFERRAL SLIP STATE ---
  const [referralForm, setReferralForm] = useState({
    patient_name: '',
    patient_id: '',
    age: '',
    gender: 'Male',
    referred_to: '',
    hospital_name: '',
    specialty: 'Cardiology',
    reason: '',
    clinical_findings: '',
    provisional_diagnosis: '',
    doctor_name: user?.full_name || 'Dr. Attending Physician',
  });

  // --- 3. MEDICAL LEAVE LETTER STATE ---
  const [leaveForm, setLeaveForm] = useState({
    patient_name: '',
    age: '',
    gender: 'Male',
    diagnosis: '',
    rest_days: '3',
    from_date: () => new Date().toISOString().split('T')[0],
    to_date: () => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    },
    fit_to_resume_date: '',
    remarks: 'Advised complete bed rest and medication adherence.',
    doctor_name: user?.full_name || 'Dr. Attending Physician',
    doctor_reg_no: 'TN-MC-48920',
  });

  useEffect(() => {
    loadHospital();
    if (selectedDocType === 'daily_op') {
      loadDailyOP(opDate);
    }
  }, [selectedDocType]);

  const loadHospital = async () => {
    try {
      const data = await settingsService.getHospital();
      setHospitalInfo(data);
    } catch (err) {
      console.error('Failed to load hospital branding:', err);
    }
  };

  const loadDailyOP = async (targetDate) => {
    try {
      setLoadingOP(true);
      const res = await reportsService.getDailyOP(targetDate);
      setOpReport(res);
    } catch (err) {
      console.error('Failed to load daily OP report:', err);
      onToast('error', 'Failed to load Daily OP census.');
    } finally {
      setLoadingOP(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Document Selector Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 flex-wrap no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedDocType('daily_op');
              loadDailyOP(opDate);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedDocType === 'daily_op'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>1. Daily OP Census Report</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDocType('referral')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedDocType === 'referral'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>2. Specialist Referral Slip</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDocType('leave_letter')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedDocType === 'leave_letter'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>3. Medical Leave Certificate</span>
          </button>
        </div>

        {/* Global Print Trigger Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="h-9 px-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Print Document (A4)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY OP REPORT VIEW */}
      {/* ========================================================================= */}
      {selectedDocType === 'daily_op' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap no-print">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Select Register Date:</label>
              <input
                type="date"
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                value={opDate}
                onChange={(e) => {
                  setOpDate(e.target.value);
                  loadDailyOP(e.target.value);
                }}
              />
              <button
                type="button"
                onClick={() => loadDailyOP(opDate)}
                className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span>Total: <strong className="text-slate-900 font-bold">{opReport?.total_registered || 0}</strong></span>
              <span>&bull;</span>
              <span className="text-emerald-700">Completed: <strong>{opReport?.total_completed || 0}</strong></span>
              <span>&bull;</span>
              <span className="text-amber-700">In Progress: <strong>{opReport?.total_pending || 0}</strong></span>
            </div>
          </div>

          {/* Printable Report Sheet */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs printable-sheet">
            {/* Printable Hospital Letterhead Header */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4 text-center space-y-0.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                {hospitalInfo?.hospital_name || 'AEREN CLINIC & HEALTHCARE'}
              </h1>
              <p className="text-xs text-teal-800 font-semibold italic">
                {hospitalInfo?.tagline || 'Excellence in Outpatient Healthcare & Diagnostics'}
              </p>
              <p className="text-[10px] text-slate-500">
                {hospitalInfo?.address || '123 Medical Center Road, Central Healthcare District'} &bull; Ph: {hospitalInfo?.phone || '+91 98765 43210'}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-800 border-t border-slate-200 mt-2">
                <span>DAILY OUTPATIENT CENSUS REGISTER</span>
                <span className="font-mono">Date: {opDate}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-2.5 border border-slate-300 w-16">Token</th>
                    <th className="py-2 px-2.5 border border-slate-300 w-24">Patient ID</th>
                    <th className="py-2 px-2.5 border border-slate-300">Patient Name</th>
                    <th className="py-2 px-2.5 border border-slate-300 w-20">Age/Sex</th>
                    <th className="py-2 px-2.5 border border-slate-300 w-28">Contact</th>
                    <th className="py-2 px-2.5 border border-slate-300">Doctor</th>
                    <th className="py-2 px-2.5 border border-slate-300">Chief Complaints &amp; Diagnosis</th>
                    <th className="py-2 px-2.5 border border-slate-300 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {loadingOP ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Loading daily OP census...
                      </td>
                    </tr>
                  ) : !opReport || opReport.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No patient registrations found for {opDate}.
                      </td>
                    </tr>
                  ) : (
                    opReport.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2.5 border border-slate-200 font-bold text-slate-900 font-mono">
                          {item.token_number}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 text-slate-600 font-mono text-[11px]">
                          {item.patient_custom_id}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 font-bold text-slate-900">
                          {item.patient_name}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 text-slate-700">
                          {item.age ? `${item.age}y` : '—'} / {item.gender?.charAt(0)}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 text-slate-600 font-mono text-[11px]">
                          {item.phone}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 text-slate-800 font-semibold">
                          {item.doctor_name}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 text-slate-700 text-[11px]">
                          <div>{item.chief_complaint}</div>
                          {item.diagnosis && item.diagnosis !== '—' && (
                            <div className="text-[10px] text-teal-800 font-semibold italic">
                              Dx: {item.diagnosis}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 border border-slate-200 text-center font-bold uppercase text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded ${
                            item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="pt-4 mt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
              <span>Report Generated: {new Date().toLocaleTimeString()} &bull; Total OPD: {opReport?.total_registered || 0}</span>
              <span className="font-semibold text-slate-700">Authorized Signature: _______________________</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SPECIALIST REFERRAL SLIP VIEW */}
      {/* ========================================================================= */}
      {selectedDocType === 'referral' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 5 Cols (Hidden in Print) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3.5 no-print">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Referral Slip Generator
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={referralForm.patient_name}
                onChange={(e) => setReferralForm({ ...referralForm, patient_name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="text"
                  value={referralForm.age}
                  onChange={(e) => setReferralForm({ ...referralForm, age: e.target.value })}
                  placeholder="e.g. 34 Yrs"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={referralForm.gender}
                  onChange={(e) => setReferralForm({ ...referralForm, gender: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Referred To (Doctor/Hospital) *</label>
                <input
                  type="text"
                  required
                  value={referralForm.referred_to}
                  onChange={(e) => setReferralForm({ ...referralForm, referred_to: e.target.value })}
                  placeholder="e.g. Dr. K. Raman / Apollo Hospital"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty Department</label>
                <input
                  type="text"
                  value={referralForm.specialty}
                  onChange={(e) => setReferralForm({ ...referralForm, specialty: e.target.value })}
                  placeholder="e.g. Cardiology, Neurology"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provisional Diagnosis</label>
              <input
                type="text"
                value={referralForm.provisional_diagnosis}
                onChange={(e) => setReferralForm({ ...referralForm, provisional_diagnosis: e.target.value })}
                placeholder="e.g. Unstable Angina / Atypical Chest Pain"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Referral &amp; Findings</label>
              <textarea
                rows={3}
                value={referralForm.reason}
                onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                placeholder="e.g. Patient presents with recurrent retrosternal chest pain. Kindly evaluate for urgent coronary angiography and higher cardiological management."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Referring Physician Name</label>
              <input
                type="text"
                value={referralForm.doctor_name}
                onChange={(e) => setReferralForm({ ...referralForm, doctor_name: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Generate &amp; Print Referral Slip</span>
            </button>
          </div>

          {/* Right Live Printable Referral Sheet: 7 Cols */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-8 shadow-xs printable-sheet space-y-6">
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-3 text-center space-y-0.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                {hospitalInfo?.hospital_name || 'AEREN CLINIC & HEALTHCARE'}
              </h1>
              <p className="text-xs text-teal-800 font-semibold italic">
                {hospitalInfo?.tagline || 'Excellence in Outpatient Healthcare & Diagnostics'}
              </p>
              <p className="text-[10px] text-slate-500">
                {hospitalInfo?.address || '123 Medical Center Road, Central Healthcare District'} &bull; Ph: {hospitalInfo?.phone || '+91 98765 43210'}
              </p>
              <div className="pt-2 text-center text-xs font-black tracking-widest text-slate-900 border-t border-slate-200 mt-2 uppercase">
                CLINICAL REFERRAL CONSULTATION SLIP
              </div>
            </div>

            {/* Date & Addressee */}
            <div className="flex justify-between items-start text-xs text-slate-800">
              <div className="space-y-1">
                <div>To:</div>
                <div className="font-bold text-sm text-slate-900">{referralForm.referred_to || '[Consultant / Hospital Name]'}</div>
                <div className="text-teal-800 font-semibold">Department of {referralForm.specialty || 'Specialty Care'}</div>
              </div>
              <div className="text-right">
                <span className="font-bold">Date:</span> {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>

            {/* Patient Demographics Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Patient Name</span>
                <span className="font-bold text-slate-900">{referralForm.patient_name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Age / Gender</span>
                <span className="font-semibold text-slate-800">{referralForm.age || '—'} / {referralForm.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Provisional Diagnosis</span>
                <span className="font-bold text-teal-800">{referralForm.provisional_diagnosis || '—'}</span>
              </div>
            </div>

            {/* Referral Body */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed min-h-[160px]">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">Clinical Summary &amp; Reason for Referral:</h4>
                <div className="p-3 bg-white border border-slate-200 rounded-lg whitespace-pre-wrap">
                  {referralForm.reason ||
                    'Patient referred for expert specialist opinion, advanced diagnostics, and further clinical management. Kindly evaluate and manage as clinically indicated.'}
                </div>
              </div>
            </div>

            {/* Doctor Seal & Signature */}
            <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-700">
              <div>
                <p className="text-[10px] text-slate-400">Thank you for your clinical cooperation.</p>
                <p className="text-[10px] text-slate-400">Please communicate back discharge summary / recommendations.</p>
              </div>
              <div className="text-right space-y-1">
                <div className="h-10"></div>
                <div className="font-bold text-slate-900 border-t border-slate-400 pt-1 min-w-[180px]">
                  {referralForm.doctor_name}
                </div>
                <div className="text-[10px] text-slate-500">Referring Medical Officer / Seal</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MEDICAL LEAVE CERTIFICATE VIEW */}
      {/* ========================================================================= */}
      {selectedDocType === 'leave_letter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 5 Cols (Hidden in Print) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3.5 no-print">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Medical Leave Certificate Generator
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={leaveForm.patient_name}
                onChange={(e) => setLeaveForm({ ...leaveForm, patient_name: e.target.value })}
                placeholder="e.g. Ananya Verma"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="text"
                  value={leaveForm.age}
                  onChange={(e) => setLeaveForm({ ...leaveForm, age: e.target.value })}
                  placeholder="e.g. 28 Yrs"
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={leaveForm.gender}
                  onChange={(e) => setLeaveForm({ ...leaveForm, gender: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis / Illness *</label>
              <input
                type="text"
                required
                value={leaveForm.diagnosis}
                onChange={(e) => setLeaveForm({ ...leaveForm, diagnosis: e.target.value })}
                placeholder="e.g. Acute Gastroenteritis with Dehydration"
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rest Days</label>
                <input
                  type="number"
                  value={leaveForm.rest_days}
                  onChange={(e) => setLeaveForm({ ...leaveForm, rest_days: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={leaveForm.from_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                  className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={leaveForm.to_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                  className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Advisory</label>
              <input
                type="text"
                value={leaveForm.remarks}
                onChange={(e) => setLeaveForm({ ...leaveForm, remarks: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={leaveForm.doctor_name}
                  onChange={(e) => setLeaveForm({ ...leaveForm, doctor_name: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Reg #</label>
                <input
                  type="text"
                  value={leaveForm.doctor_reg_no}
                  onChange={(e) => setLeaveForm({ ...leaveForm, doctor_reg_no: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Generate &amp; Print Medical Certificate</span>
            </button>
          </div>

          {/* Right Live Printable Certificate: 7 Cols */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-8 shadow-xs printable-sheet space-y-6">
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-3 text-center space-y-0.5">
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                {hospitalInfo?.hospital_name || 'AEREN CLINIC & HEALTHCARE'}
              </h1>
              <p className="text-xs text-teal-800 font-semibold italic">
                {hospitalInfo?.tagline || 'Excellence in Outpatient Healthcare & Diagnostics'}
              </p>
              <p className="text-[10px] text-slate-500">
                {hospitalInfo?.address || '123 Medical Center Road, Central Healthcare District'} &bull; Ph: {hospitalInfo?.phone || '+91 98765 43210'}
              </p>
              <div className="pt-2 text-center text-xs font-black tracking-widest text-slate-900 border-t border-slate-200 mt-2 uppercase">
                MEDICAL FITNESS &amp; LEAVE CERTIFICATE
              </div>
            </div>

            {/* Certificate Header Info */}
            <div className="flex justify-between items-center text-xs text-slate-800 font-semibold">
              <span>Ref No: <span className="font-mono">MED-CERT/{new Date().getFullYear()}/{Math.floor(1000 + Math.random() * 9000)}</span></span>
              <span>Date of Issue: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Certificate Narrative Body */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs text-slate-800 leading-loose">
              <p>
                This is to certify that{' '}
                <strong className="font-bold text-slate-950 underline decoration-slate-400 underline-offset-4">
                  {leaveForm.patient_name || '________________________'}
                </strong>
                , aged{' '}
                <strong className="font-bold text-slate-950">
                  {leaveForm.age || '__'} years
                </strong>
                , gender{' '}
                <strong className="font-bold text-slate-950">
                  {leaveForm.gender}
                </strong>
                , has been under my medical outpatient care at this clinic.
              </p>

              <p>
                The patient was clinically examined and diagnosed with{' '}
                <strong className="font-bold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {leaveForm.diagnosis || '[Clinical Diagnosis]'}
                </strong>
                .
              </p>

              <p>
                I consider that a period of absence from duty / work of{' '}
                <strong className="font-bold text-slate-950">
                  {leaveForm.rest_days} days
                </strong>{' '}
                with effect from{' '}
                <strong className="font-bold text-slate-950">
                  {leaveForm.from_date}
                </strong>{' '}
                to{' '}
                <strong className="font-bold text-slate-950">
                  {leaveForm.to_date}
                </strong>{' '}
                is necessary for the restoration of their health.
              </p>

              <p className="italic text-slate-600 pt-2">
                Advisory Remarks: {leaveForm.remarks}
              </p>
            </div>

            {/* Doctor Seal & Signature */}
            <div className="pt-10 border-t border-slate-200 flex items-end justify-between text-xs text-slate-700">
              <div>
                <p className="text-[10px] text-slate-400">Valid only with registered medical practitioner signature &amp; seal.</p>
                <p className="text-[10px] text-slate-400 font-mono">Clinic Reg: {hospitalInfo?.registration_number || 'REG-TN-2024-8849'}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="h-10"></div>
                <div className="font-bold text-slate-900 border-t border-slate-400 pt-1 min-w-[200px]">
                  {leaveForm.doctor_name}
                </div>
                <div className="text-[10px] text-slate-600 font-mono">Reg No: {leaveForm.doctor_reg_no}</div>
                <div className="text-[10px] text-slate-500">Authorized Medical Officer</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
