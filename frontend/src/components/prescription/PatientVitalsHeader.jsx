import React from 'react';

/**
 * Premium SaaS Patient & Vitals Sticky Glassmorphic Header
 */
export default function PatientVitalsHeader({
  patient = {},
  visit = {},
  vitals = {},
  consultantName = '',
  elapsedWaitMinutes = 0,
}) {
  const isHighBp = () => {
    if (vitals.bp_systolic && vitals.bp_systolic >= 140) return true;
    if (vitals.bp_diastolic && vitals.bp_diastolic >= 90) return true;
    if (vitals.blood_pressure) {
      const parts = vitals.blood_pressure.split('/');
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

  const isHighSugar = () => {
    const g = parseInt(vitals.grbs_mg_dl || vitals.sugar, 10);
    return g >= 200;
  };

  const bpVal =
    vitals.blood_pressure ||
    (vitals.bp_systolic && vitals.bp_diastolic
      ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
      : null);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-6 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 -mx-4 -mt-4 mb-2">
      {/* 1. Demographics & Timing Subtitle */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2.5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {patient.name || patient.full_name || 'Patient Consultation'}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200/70">
            {patient.patient_id || `#${patient.id || '—'}`}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/80 text-slate-700 border border-slate-200/60">
            {patient.age ? `${patient.age} Yrs` : patient.age_years ? `${patient.age_years} Yrs` : '—'} /{' '}
            {patient.gender || '—'}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
          <span>
            Consultant:{' '}
            <strong className="font-semibold text-slate-700">
              {consultantName || visit.consultant_assigned || 'Dr. T.S.Jeyagowthaman'}
            </strong>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>
            Visit:{' '}
            <strong className="font-semibold text-slate-700">
              {visit.visit_number || `V-${visit.id}`}
            </strong>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>
            Waiting: <strong className="font-semibold text-slate-700">{elapsedWaitMinutes}m</strong>
          </span>
        </div>
      </div>

      {/* 2. Sleek Vitals Pill Badges */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Weight & BMI */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/80 border border-slate-200/70 text-slate-700">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">WT</span>
          <strong className="font-semibold text-slate-900">
            {vitals.weight_kg || vitals.weight || '—'} kg
          </strong>
          {vitals.bmi && (
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-200/60">
              BMI {vitals.bmi}
            </span>
          )}
        </div>

        {/* Height */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/80 border border-slate-200/70 text-slate-700">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">HT</span>
          <strong className="font-semibold text-slate-900">
            {vitals.height_cm || '—'} cm
          </strong>
        </div>

        {/* Blood Pressure */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
            isHighBp()
              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold animate-pulse'
              : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
          }`}
        >
          <span className="font-bold text-[10px] opacity-70 uppercase tracking-wider">BP</span>
          <strong className="font-semibold">{bpVal || '—'} mmHg</strong>
        </div>

        {/* Temperature */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
            isHighTemp()
              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
              : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
          }`}
        >
          <span className="font-bold text-[10px] opacity-70 uppercase tracking-wider">TEMP</span>
          <strong className="font-semibold">
            {vitals.temperature_f ||
              (vitals.temperature ? `${vitals.temperature}°C` : '—')}
            °F
          </strong>
        </div>

        {/* Pulse Rate */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/80 border border-slate-200/70 text-slate-700">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">PR</span>
          <strong className="font-semibold text-slate-900">
            {vitals.pulse_rate_bpm || vitals.pr || '—'} bpm
          </strong>
        </div>

        {/* SPO2 */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
            isLowSpo2()
              ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
              : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
          }`}
        >
          <span className="font-bold text-[10px] opacity-70 uppercase tracking-wider">SPO2</span>
          <strong className="font-semibold">
            {vitals.spo2_percent || vitals.spo2 || '—'}%
          </strong>
        </div>

        {/* GRBS */}
        {Boolean(vitals.grbs_mg_dl || vitals.sugar) && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
              isHighSugar()
                ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                : 'bg-slate-100/80 border-slate-200/70 text-slate-700'
            }`}
          >
            <span className="font-bold text-[10px] opacity-70 uppercase tracking-wider">GRBS</span>
            <strong className="font-semibold">
              {vitals.grbs_mg_dl || vitals.sugar} mg/dL
            </strong>
          </div>
        )}
      </div>
    </header>
  );
}
