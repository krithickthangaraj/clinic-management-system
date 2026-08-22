import { useState } from 'react';

/**
 * Ultra-Compact Top Ribbon: Demographics, Packed Vitals & Far-Right History Summary
 */
export default function PatientVitalsHeader({
  patient = {},
  visit = {},
  vitals = {},
  history = {},
  consultantName = '',
  elapsedWaitMinutes = 0,
}) {
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);

  const isHighBp = () => {
    if (vitals.bp_systolic && vitals.bp_systolic >= 140) return true;
    if (vitals.bp_diastolic && vitals.bp_diastolic >= 90) return true;
    if (vitals.blood_pressure) {
      const parts = String(vitals.blood_pressure).split('/');
      if (parseInt(parts[0], 10) >= 140 || parseInt(parts[1], 10) >= 90) return true;
    }
    return false;
  };

  const isHighTemp = () => {
    const t = parseFloat(vitals.temperature_f || vitals.temperature);
    return t >= 99.5;
  };

  const isLowSpo2 = () => {
    const s = parseInt(vitals.spo2_percent || vitals.spo2, 10);
    return s > 0 && s < 95;
  };

  const bpVal =
    vitals.blood_pressure ||
    (vitals.bp_systolic && vitals.bp_diastolic
      ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
      : null);

  const totalHistoryCount =
    (history.allergy_history?.length || 0) +
    (history.past_history?.length || 0) +
    (history.surgical_history?.length || 0) +
    (history.family_history?.length || 0);

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-5 py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 -mx-4 -mt-4 mb-4"
      data-testid="sticky-vitals-header"
    >
      {/* 1. Demographics Left Side */}
      <div className="flex items-center flex-wrap gap-2.5 min-w-0">
        <h2
          className="text-base font-bold text-slate-900 tracking-tight truncate"
          data-testid="patient-name-header"
        >
          {patient.name || patient.full_name || 'Patient Consultation'}
        </h2>
        <span
          className="inline-flex items-center h-6 px-2 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200/70"
          data-testid="patient-id-badge"
        >
          {patient.patient_id || `#${patient.id || '—'}`}
        </span>
        <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
          {patient.age ? `${patient.age} Yrs` : patient.age_years ? `${patient.age_years} Yrs` : '—'} /{' '}
          {patient.gender || '—'}
        </span>
        <span className="text-slate-300 hidden sm:inline">&bull;</span>
        <span className="text-xs text-slate-500 hidden sm:inline truncate">
          Consultant: <strong className="font-semibold text-slate-700">{consultantName || visit.consultant_assigned || 'Dr. T.S.Jeyagowthaman'}</strong>
        </span>
      </div>

      {/* 2. Center: Packed Vitals Pill Badges */}
      <div className="flex items-center flex-wrap gap-1.5" data-testid="vitals-badges-container">
        {/* WT & BMI */}
        <div className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-medium bg-slate-100/80 border border-slate-200/70 text-slate-700">
          <span className="font-bold text-[10px] text-slate-400">WT</span>
          <strong className="font-semibold text-slate-900">{vitals.weight_kg || vitals.weight || '—'}kg</strong>
          {vitals.bmi && (
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1 rounded-full">
              BMI {vitals.bmi}
            </span>
          )}
        </div>

        {/* BP */}
        <div
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs border ${
            isHighBp()
              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold animate-pulse'
              : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
          }`}
          data-testid="bp-vital-badge"
        >
          <span className="font-bold text-[10px] opacity-70">BP</span>
          <strong className="font-semibold">{bpVal || '—'}</strong>
        </div>

        {/* TEMP */}
        <div
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs border ${
            isHighTemp()
              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
              : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
          }`}
          data-testid="temp-vital-badge"
        >
          <span className="font-bold text-[10px] opacity-70">TEMP</span>
          <strong className="font-semibold">{vitals.temperature_f || vitals.temperature || '—'}°F</strong>
        </div>

        {/* PR */}
        <div className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-medium bg-slate-100/80 border border-slate-200/70 text-slate-700">
          <span className="font-bold text-[10px] text-slate-400">PR</span>
          <strong className="font-semibold text-slate-900">{vitals.pulse_rate_bpm || vitals.pr || '—'}</strong>
        </div>

        {/* SPO2 */}
        <div
          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs border ${
            isLowSpo2()
              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
              : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
          }`}
          data-testid="spo2-vital-badge"
        >
          <span className="font-bold text-[10px] opacity-70">SPO2</span>
          <strong className="font-semibold">{vitals.spo2_percent || vitals.spo2 || '—'}%</strong>
        </div>
      </div>

      {/* 3. Far Right: Compact Medical History Indicator & Popover */}
      <div className="relative flex items-center gap-2 justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
          onClick={() => setShowHistoryPopover(!showHistoryPopover)}
          title="Click to view Patient Medical History"
          data-testid="btn-history-popover-toggle"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>History ({totalHistoryCount})</span>
          {history.allergy_history?.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>

        {/* Quick History Dropdown Popover */}
        {showHistoryPopover && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-slate-800">Medical History Summary</span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                onClick={() => setShowHistoryPopover(false)}
              >
                &times;
              </button>
            </div>

            {history.allergy_history?.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase">Allergies:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {history.allergy_history.map((a, i) => (
                    <span key={i} className="text-[11px] bg-rose-50 text-rose-800 px-2 py-0.5 rounded font-medium border border-rose-200">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {history.past_history?.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Past Conditions:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {history.past_history.map((p, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {totalHistoryCount === 0 && (
              <span className="text-xs text-slate-400 italic block py-1">
                No prior medical records registered.
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
