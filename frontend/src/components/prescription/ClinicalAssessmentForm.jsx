import { useState } from 'react';
import SmartCombobox from './SmartCombobox';

const QUICK_DURATION_CHIPS = [
  '1 day',
  '2 days',
  '3 days',
  '5 days',
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
];

export default function ClinicalAssessmentForm({
  assessment = {
    complaints: [],
    duration: '',
    diagnosis: [],
    examination: '',
  },
  onChange = () => {},
}) {
  const [complaintInput, setComplaintInput] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');

  const handleAddComplaint = (text) => {
    const trimmed = (text || complaintInput).trim();
    if (!trimmed) return;
    const current = assessment.complaints || [];
    const exists = current.some(
      (item) => (typeof item === 'string' ? item : item.complaint) === trimmed
    );
    if (!exists) {
      onChange({
        ...assessment,
        complaints: [
          ...current,
          { complaint: trimmed, duration: assessment.duration || '' },
        ],
      });
    }
    setComplaintInput('');
  };

  const handleRemoveComplaint = (index) => {
    const current = assessment.complaints || [];
    onChange({
      ...assessment,
      complaints: current.filter((_, i) => i !== index),
    });
  };

  const handleAddDiagnosis = (text) => {
    const trimmed = (text || diagnosisInput).trim();
    if (!trimmed) return;
    const current = assessment.diagnosis || [];
    if (!current.includes(trimmed)) {
      onChange({
        ...assessment,
        diagnosis: [...current, trimmed],
      });
    }
    setDiagnosisInput('');
  };

  const handleRemoveDiagnosis = (index) => {
    const current = assessment.diagnosis || [];
    onChange({
      ...assessment,
      diagnosis: current.filter((_, i) => i !== index),
    });
  };

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 mb-6"
      data-testid="clinical-assessment-card"
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Clinical Assessment &amp; Findings
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Master suggestions &amp; autocomplete active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN: Complaints & Duration
           ========================================================================= */}
        <div className="space-y-3.5">
          {/* Smart Complaints Combobox */}
          <SmartCombobox
            category="complaints"
            label="Chief Complaints"
            placeholder="Type or select complaint (e.g. High fever)..."
            value={complaintInput}
            onChange={setComplaintInput}
            onSelectTag={handleAddComplaint}
            testId="input-complaint"
          />

          {/* Active Complaints Tags (Smart Truncation with Tooltips) */}
          <div className="flex flex-wrap gap-1.5 min-h-[26px]" data-testid="complaints-tags-cloud">
            {(assessment.complaints || []).map((item, idx) => {
              const label = typeof item === 'string' ? item : item.complaint;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 max-w-[280px] px-3 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/70 shadow-2xs group"
                  title={label}
                  data-testid={`complaint-tag-${idx}`}
                >
                  <span className="truncate">{label}</span>
                  <button
                    type="button"
                    className="hover:text-sky-950 font-bold ml-0.5 cursor-pointer shrink-0"
                    onClick={() => handleRemoveComplaint(idx)}
                    aria-label={`Remove ${label}`}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>

          {/* Total Duration Input with 1-Click Suggestion Chips */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Duration
              </label>
              <span className="text-[10px] text-slate-400">1-click chips</span>
            </div>

            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
              placeholder="e.g. 3 days, 1 week..."
              value={assessment.duration || ''}
              onChange={(e) =>
                onChange({ ...assessment, duration: e.target.value })
              }
              data-testid="input-duration"
            />

            {/* Instant Clickable Duration Chips */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {QUICK_DURATION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="h-6 px-2.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md transition-all cursor-pointer shadow-2xs flex items-center"
                  onClick={() => onChange({ ...assessment, duration: chip })}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Diagnosis & Examination
           ========================================================================= */}
        <div className="space-y-3.5">
          {/* Smart Diagnosis Combobox */}
          <SmartCombobox
            category="diagnoses"
            label="Provisional / Final Diagnosis"
            placeholder="Type or select diagnosis (e.g. Acute Bronchitis)..."
            value={diagnosisInput}
            onChange={setDiagnosisInput}
            onSelectTag={handleAddDiagnosis}
            testId="input-diagnosis"
          />

          {/* Active Diagnosis Tags (Smart Truncation) */}
          <div className="flex flex-wrap gap-1.5 min-h-[26px]" data-testid="diagnosis-tags-cloud">
            {(assessment.diagnosis || []).map((diag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 max-w-[280px] px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs"
                title={diag}
                data-testid={`diagnosis-tag-${idx}`}
              >
                <span className="truncate">{diag}</span>
                <button
                  type="button"
                  className="hover:text-emerald-950 font-bold ml-0.5 cursor-pointer shrink-0"
                  onClick={() => handleRemoveDiagnosis(idx)}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          {/* Physical Examination Textarea */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Physical &amp; Systemic Examination
            </label>
            <textarea
              className="w-full h-20 min-h-[80px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all resize-y"
              placeholder="Systemic examination: Chest clear, Throat congested, Soft abdomen, No pallor/edema..."
              value={assessment.examination || ''}
              onChange={(e) =>
                onChange({ ...assessment, examination: e.target.value })
              }
              data-testid="input-examination"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
