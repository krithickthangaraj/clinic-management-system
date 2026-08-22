import { useState } from 'react';

/**
 * Single-Line PatientVitalsHeader Component
 * Perfectly aligned in a single horizontal row across desktop viewports:
 * - Left: Demographics & Waiting Time
 * - Right: All 9 Vitals Badges (WT, HT, BMI, BP, TEMP, PR, SPO2, GRBS, RR) with seamless click-to-edit
 */
export default function PatientVitalsHeader({
  patient = {},
  visit = {},
  vitals = {},
  consultantName = '',
  elapsedWaitMinutes = 0,
  onUpdateVital = () => {},
}) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

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

  const isHighSugar = () => {
    const g = parseInt(vitals.grbs_mg_dl || vitals.sugar, 10);
    return g >= 200;
  };

  const bpVal =
    vitals.blood_pressure ||
    (vitals.bp_systolic && vitals.bp_diastolic
      ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
      : null);

  const isCompleted =
    String(visit.status || '').toLowerCase() === 'completed' ||
    String(patient.status || '').toLowerCase() === 'completed';

  const startEdit = (field, initialVal) => {
    setEditingField(field);
    setTempValue(initialVal !== undefined && initialVal !== null ? String(initialVal) : '');
  };

  const saveEdit = (field, parser = (v) => v) => {
    if (tempValue.trim() !== '') {
      onUpdateVital(field, parser(tempValue.trim()));
    }
    setEditingField(null);
    setTempValue('');
  };

  return (
    <header
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-5 py-2.5 flex items-center justify-between gap-4 -mx-4 -mt-4 mb-4 overflow-x-auto"
      data-testid="sticky-vitals-header"
    >
      {/* 1. Demographics Left Side (Single Line) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <h2
          className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap"
          data-testid="patient-name-header"
        >
          {patient.name || patient.full_name || 'Patient Consultation'}
        </h2>

        <span
          className="inline-flex items-center h-6 px-2 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200/70 whitespace-nowrap"
          data-testid="patient-id-badge"
        >
          {patient.patient_id || `#${patient.id || '—'}`}
        </span>

        <span className="inline-flex items-center h-6 px-2 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-nowrap">
          {patient.age ? `${patient.age} Yrs` : patient.age_years ? `${patient.age_years} Yrs` : '—'} /{' '}
          {patient.gender || '—'}
        </span>

        <span className="text-slate-300 hidden md:inline">&bull;</span>

        <span className="text-xs text-slate-500 hidden lg:inline whitespace-nowrap">
          Doctor: <strong className="font-semibold text-slate-700">{consultantName || visit.consultant_assigned || 'Dr. T.S.Jeyagowthaman'}</strong>
        </span>

        <span className="text-slate-300 hidden md:inline">&bull;</span>

        <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
          <span>Waiting:</span>
          <strong
            className={`font-semibold ${isCompleted ? 'text-slate-500 font-mono' : 'text-slate-700'}`}
            data-testid="header-waiting-time"
          >
            {elapsedWaitMinutes}m {isCompleted && '(Completed)'}
          </strong>
        </span>
      </div>

      {/* 2. All 9 Vitals Badges on the Right Side (Single Line, Click-to-Edit) */}
      <div className="flex items-center gap-1.5 shrink-0" data-testid="vitals-badges-container">
        {/* 1. Weight (WT) */}
        {editingField === 'weight' ? (
          <input
            type="number"
            className="w-18 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="WT kg"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('weight_kg', parseFloat)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('weight_kg', parseFloat)}
            data-testid="input-edit-weight"
          />
        ) : (
          <div
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200/70 text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
            onClick={() => startEdit('weight', vitals.weight_kg || vitals.weight)}
            title="Click to edit Weight"
            data-testid="vital-badge-weight"
          >
            <span className="font-bold text-[10px] text-slate-400">WT</span>
            <strong className="font-semibold text-slate-900">{vitals.weight_kg || vitals.weight || '—'} kg</strong>
          </div>
        )}

        {/* 2. Height (HT) */}
        {editingField === 'height' ? (
          <input
            type="number"
            className="w-18 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="HT cm"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('height_cm', parseFloat)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('height_cm', parseFloat)}
            data-testid="input-edit-height"
          />
        ) : (
          <div
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200/70 text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
            onClick={() => startEdit('height', vitals.height_cm)}
            title="Click to edit Height"
            data-testid="vital-badge-height"
          >
            <span className="font-bold text-[10px] text-slate-400">HT</span>
            <strong className="font-semibold text-slate-900">{vitals.height_cm || '—'} cm</strong>
          </div>
        )}

        {/* 3. BMI */}
        <div
          className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium bg-teal-50 border border-teal-200/70 text-teal-800 whitespace-nowrap"
          title="Body Mass Index (Auto-calculated from WT & HT)"
          data-testid="vital-badge-bmi"
        >
          <span className="font-bold text-[10px] text-teal-600">BMI</span>
          <strong className="font-semibold">{vitals.bmi || (vitals.weight_kg && vitals.height_cm ? (vitals.weight_kg / Math.pow(vitals.height_cm / 100, 2)).toFixed(1) : '—')}</strong>
        </div>

        {/* 4. Blood Pressure (BP) */}
        {editingField === 'bp' ? (
          <input
            type="text"
            className="w-22 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="120/80"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('blood_pressure', (v) => v)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('blood_pressure', (v) => v)}
            data-testid="input-edit-bp"
          />
        ) : (
          <div
            className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs border cursor-pointer transition-colors whitespace-nowrap ${
              isHighBp()
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 font-semibold animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200/70 text-slate-700'
            }`}
            onClick={() => startEdit('bp', bpVal)}
            title="Click to edit Blood Pressure"
            data-testid="bp-vital-badge"
          >
            <span className="font-bold text-[10px] opacity-70">BP</span>
            <strong className="font-semibold">{bpVal || '—'}</strong>
          </div>
        )}

        {/* 5. Temperature (TEMP) */}
        {editingField === 'temp' ? (
          <input
            type="number"
            step="0.1"
            className="w-18 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="TEMP °F"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('temperature_f', parseFloat)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('temperature_f', parseFloat)}
            data-testid="input-edit-temp"
          />
        ) : (
          <div
            className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs border cursor-pointer transition-colors whitespace-nowrap ${
              isHighTemp()
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200/70 text-slate-700'
            }`}
            onClick={() => startEdit('temp', vitals.temperature_f || vitals.temperature)}
            title="Click to edit Temperature"
            data-testid="temp-vital-badge"
          >
            <span className="font-bold text-[10px] opacity-70">TEMP</span>
            <strong className="font-semibold">{vitals.temperature_f || vitals.temperature || '—'} °F</strong>
          </div>
        )}

        {/* 6. Pulse Rate (PR) */}
        {editingField === 'pr' ? (
          <input
            type="number"
            className="w-18 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="PR bpm"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('pulse_rate_bpm', parseInt)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('pulse_rate_bpm', parseInt)}
            data-testid="input-edit-pr"
          />
        ) : (
          <div
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200/70 text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
            onClick={() => startEdit('pr', vitals.pulse_rate_bpm || vitals.pr)}
            title="Click to edit Pulse Rate"
            data-testid="vital-badge-pr"
          >
            <span className="font-bold text-[10px] text-slate-400">PR</span>
            <strong className="font-semibold text-slate-900">{vitals.pulse_rate_bpm || vitals.pr || '—'}</strong>
          </div>
        )}

        {/* 7. SPO2 */}
        {editingField === 'spo2' ? (
          <input
            type="number"
            className="w-18 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="SPO2 %"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('spo2_percent', parseInt)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('spo2_percent', parseInt)}
            data-testid="input-edit-spo2"
          />
        ) : (
          <div
            className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs border cursor-pointer transition-colors whitespace-nowrap ${
              isLowSpo2()
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200/70 text-slate-700'
            }`}
            onClick={() => startEdit('spo2', vitals.spo2_percent || vitals.spo2)}
            title="Click to edit SPO2"
            data-testid="spo2-vital-badge"
          >
            <span className="font-bold text-[10px] opacity-70">SPO2</span>
            <strong className="font-semibold">{vitals.spo2_percent || vitals.spo2 || '—'}%</strong>
          </div>
        )}

        {/* 8. GRBS (Blood Sugar) */}
        {editingField === 'sugar' ? (
          <input
            type="number"
            className="w-22 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="GRBS mg/dL"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('grbs_mg_dl', parseInt)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('grbs_mg_dl', parseInt)}
            data-testid="input-edit-sugar"
          />
        ) : (
          <div
            className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs border cursor-pointer transition-colors whitespace-nowrap ${
              isHighSugar()
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200/70 text-slate-700'
            }`}
            onClick={() => startEdit('sugar', vitals.grbs_mg_dl || vitals.sugar)}
            title="Click to edit Blood Sugar (GRBS)"
            data-testid="grbs-vital-badge"
          >
            <span className="font-bold text-[10px] opacity-70">GRBS</span>
            <strong className="font-semibold">{vitals.grbs_mg_dl || vitals.sugar || '—'}</strong>
          </div>
        )}

        {/* 9. Respiratory Rate (RR) */}
        {editingField === 'rr' ? (
          <input
            type="number"
            className="w-18 h-7 px-1.5 text-xs font-semibold bg-white border border-teal-500 rounded-full focus:outline-none text-center shadow-xs"
            value={tempValue}
            placeholder="RR /min"
            autoFocus
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => saveEdit('respiratory_rate', parseInt)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit('respiratory_rate', parseInt)}
            data-testid="input-edit-rr"
          />
        ) : (
          <div
            className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200/70 text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
            onClick={() => startEdit('rr', vitals.respiratory_rate || vitals.rr)}
            title="Click to edit Respiratory Rate"
            data-testid="vital-badge-rr"
          >
            <span className="font-bold text-[10px] text-slate-400">RR</span>
            <strong className="font-semibold text-slate-900">{vitals.respiratory_rate || vitals.rr || '—'}</strong>
          </div>
        )}
      </div>
    </header>
  );
}
