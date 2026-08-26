import React, { useMemo } from 'react';
import { calculateBmi } from '../../hooks/usePatientCalculations';
import { StethoscopeIcon } from '../common/MedicalIcons';

const CONSULTANT_OPTIONS = [
  'Dr. T.S.Jeyagowthaman',
  'Dr. Tamil Iniyan',
  'Dr. Anuradha',
  'Dr. A.K.K.Shanmugaranman',
  'Staff nurse',
];

export default function VitalsCard({
  vitals,
  onChange,
  errors = {},
}) {
  // Real-time BMI calculation
  const bmiData = useMemo(() => {
    return calculateBmi(vitals.weight_kg, vitals.height_cm);
  }, [vitals.weight_kg, vitals.height_cm]);

  const handleFieldChange = (field, value) => {
    onChange({ [field]: value });
  };

  // Dual BP input or unified format handler
  const handleBpSystolicChange = (val) => {
    const s = val.replace(/\D/g, '').slice(0, 3);
    const d = vitals.bp_diastolic || '';
    const bpStr = s && d ? `${s}/${d}` : s ? `${s}/` : '';
    onChange({
      bp_systolic: s,
      blood_pressure: bpStr,
    });
  };

  const handleBpDiastolicChange = (val) => {
    const d = val.replace(/\D/g, '').slice(0, 3);
    const s = vitals.bp_systolic || '';
    const bpStr = s && d ? `${s}/${d}` : d ? `/${d}` : '';
    onChange({
      bp_diastolic: d,
      blood_pressure: bpStr,
    });
  };

  return (
    <section className="form-card vitals-card">
      <div className="card-header-banner">
        <div className="banner-left">
          <span className="banner-icon-badge">
            <StethoscopeIcon className="banner-svg-icon" />
          </span>
          <div>
            <h2 className="banner-title">Clinical Vitals &amp; Visit Details</h2>
            <p className="banner-subtitle">Physical metrics, blood glucose, consultant assignment, and clinical remarks</p>
          </div>
        </div>

        {/* Live Dynamic BMI Display Chip */}
        <div className="banner-right">
          <div className="bmi-display-panel" title="Auto-calculated from Height & Weight">
            <span className="bmi-label">Calculated BMI</span>
            <div className="bmi-value-group">
              <span className="bmi-number">{bmiData.bmi || '—'}</span>
              <span className="bmi-unit">kg/m²</span>
              {bmiData.bmi && (
                <span className={`bmi-status-badge ${bmiData.badgeClass}`}>
                  {bmiData.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body-grid grid-4-col">
        {/* Weight (kg, max 200) */}
        <div className={`field-group ${errors.weight_kg ? 'has-error' : ''}`}>
          <label htmlFor="vital_weight" className="field-label">
            Weight (kg) <span className="field-limit-hint">[Max 200]</span>
          </label>
          <div className="unit-input-wrapper">
            <input
              id="vital_weight"
              name="weight_kg"
              type="number"
              min="1"
              max="200"
              step="0.1"
              className="form-input text-right"
              placeholder="70.0"
              value={vitals.weight_kg ?? ''}
              onChange={(e) => handleFieldChange('weight_kg', e.target.value)}
            />
            <span className="unit-suffix">kg</span>
          </div>
          {errors.weight_kg && <span className="field-error-text">{errors.weight_kg}</span>}
        </div>

        {/* Height (cm, max 250) */}
        <div className={`field-group ${errors.height_cm ? 'has-error' : ''}`}>
          <label htmlFor="vital_height" className="field-label">
            Height (cm) <span className="field-limit-hint">[Max 250]</span>
          </label>
          <div className="unit-input-wrapper">
            <input
              id="vital_height"
              name="height_cm"
              type="number"
              min="10"
              max="250"
              step="0.1"
              className="form-input text-right"
              placeholder="170.0"
              value={vitals.height_cm ?? ''}
              onChange={(e) => handleFieldChange('height_cm', e.target.value)}
            />
            <span className="unit-suffix">cm</span>
          </div>
          {errors.height_cm && <span className="field-error-text">{errors.height_cm}</span>}
        </div>

        {/* Blood Pressure (e.g. 110/80) */}
        <div className={`field-group ${errors.blood_pressure ? 'has-error' : ''}`}>
          <label htmlFor="vital_bp_sys" className="field-label">
            Blood Pressure (mmHg)
          </label>
          <div className="bp-compound-input">
            <input
              id="vital_bp_sys"
              type="number"
              min="40"
              max="260"
              className="form-input bp-sub-input"
              placeholder="120"
              value={vitals.bp_systolic ?? ''}
              onChange={(e) => handleBpSystolicChange(e.target.value)}
              title="Systolic BP"
            />
            <span className="bp-slash-separator">/</span>
            <input
              id="vital_bp_dia"
              type="number"
              min="30"
              max="160"
              className="form-input bp-sub-input"
              placeholder="80"
              value={vitals.bp_diastolic ?? ''}
              onChange={(e) => handleBpDiastolicChange(e.target.value)}
              title="Diastolic BP"
            />
          </div>
          {errors.blood_pressure && (
            <span className="field-error-text">{errors.blood_pressure}</span>
          )}
        </div>

        {/* Temperature (°F) */}
        <div className="field-group">
          <label htmlFor="vital_temp" className="field-label">
            Temperature (°F)
          </label>
          <div className="unit-input-wrapper">
            <input
              id="vital_temp"
              name="temperature_f"
              type="number"
              step="0.1"
              min="85"
              max="110"
              className="form-input text-right"
              placeholder="98.6"
              value={vitals.temperature_f ?? ''}
              onChange={(e) => handleFieldChange('temperature_f', e.target.value)}
            />
            <span className="unit-suffix">°F</span>
          </div>
        </div>

        {/* SpO2 (% max 100) */}
        <div className={`field-group ${errors.spo2_percent ? 'has-error' : ''}`}>
          <label htmlFor="vital_spo2" className="field-label">
            SpO₂ (%) <span className="field-limit-hint">[Max 100]</span>
          </label>
          <div className="unit-input-wrapper">
            <input
              id="vital_spo2"
              name="spo2_percent"
              type="number"
              min="0"
              max="100"
              className="form-input text-right"
              placeholder="98"
              value={vitals.spo2_percent ?? ''}
              onChange={(e) => handleFieldChange('spo2_percent', e.target.value)}
            />
            <span className="unit-suffix">%</span>
          </div>
          {errors.spo2_percent && (
            <span className="field-error-text">{errors.spo2_percent}</span>
          )}
        </div>

        {/* Pulse Rate (bpm) */}
        <div className="field-group">
          <label htmlFor="vital_pulse" className="field-label">
            Pulse Rate (bpm)
          </label>
          <div className="unit-input-wrapper">
            <input
              id="vital_pulse"
              name="pulse_rate_bpm"
              type="number"
              min="30"
              max="240"
              className="form-input text-right"
              placeholder="72"
              value={vitals.pulse_rate_bpm ?? ''}
              onChange={(e) => handleFieldChange('pulse_rate_bpm', e.target.value)}
            />
            <span className="unit-suffix">bpm</span>
          </div>
        </div>

        {/* GRBS (mg/dL) */}
        <div className="field-group">
          <label htmlFor="vital_grbs" className="field-label">
            GRBS (Blood Sugar)
          </label>
          <div className="unit-input-wrapper">
            <input
              id="vital_grbs"
              name="grbs_mg_dl"
              type="number"
              min="20"
              max="800"
              className="form-input text-right"
              placeholder="120"
              value={vitals.grbs_mg_dl ?? ''}
              onChange={(e) => handleFieldChange('grbs_mg_dl', e.target.value)}
            />
            <span className="unit-suffix">mg/dL</span>
          </div>
        </div>

        {/* Consultant Assigned Dropdown */}
        <div className="field-group">
          <label htmlFor="vital_consultant" className="field-label font-bold text-teal-900">
            Consultant Assigned
          </label>
          <select
            id="vital_consultant"
            name="consultant_assigned"
            className="form-select font-semibold text-slate-900 border-teal-500 ring-1 ring-teal-500/50 bg-white"
            value={vitals.consultant_assigned || 'Dr. T.S.Jeyagowthaman'}
            onChange={(e) => handleFieldChange('consultant_assigned', e.target.value)}
          >
            {CONSULTANT_OPTIONS.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </div>

        {/* Clinical Remarks Textarea */}
        <div className="field-group col-span-4">
          <label htmlFor="vital_remarks" className="field-label">
            Clinical Remarks &amp; Initial Notes
          </label>
          <textarea
            id="vital_remarks"
            name="remarks"
            rows={2}
            className="form-textarea"
            placeholder="e.g., Inj.Para, Levolin 1.25 Neb, Fever for 2 days"
            value={vitals.remarks || ''}
            onChange={(e) => handleFieldChange('remarks', e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
