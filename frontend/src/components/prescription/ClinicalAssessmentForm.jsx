import React, { useState } from 'react';
import SmartField from './SmartField';

const DURATION_UNITS = ['Days', 'Weeks', 'Months', 'Years'];

/**
 * ClinicalAssessmentForm Component
 * - Left: Chief Complaints (SmartField with dynamic suggestion removal & single-line tags) + Compact Duration
 * - Right: Diagnosis (SmartField with dynamic suggestion removal & single-line tags) + Physical Examination
 * - Compact, production-grade vertical spacing
 */
export default function ClinicalAssessmentForm({
  assessment = {
    complaints: [],
    duration_value: 3,
    duration_unit: 'Days',
    duration: '',
    diagnosis: [],
    examination: '',
  },
  onChange = () => {},
}) {
  const [isOpen, setIsOpen] = useState(true);
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
          {
            complaint: trimmed,
            duration: `${assessment.duration_value || 3} ${assessment.duration_unit || 'Days'}`,
          },
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

  const complaintExcludeList = (assessment.complaints || []).map((c) =>
    typeof c === 'string' ? c : c.complaint || ''
  );

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
      data-testid="clinical-assessment-card"
    >
      <div
        className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Clinical Assessment &amp; Findings
          </h3>
          {(assessment.complaints || []).length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
              {(assessment.complaints || []).length} Complaint{(assessment.complaints || []).length > 1 ? 's' : ''}
            </span>
          )}
          {(assessment.diagnosis || []).length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
              {(assessment.diagnosis || []).length} Diagnosis
            </span>
          )}
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Toggle clinical assessment panel"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN: Complaints & Compact Duration
           ========================================================================= */}
        <div className="space-y-2">
          {/* Smart Complaints Field with Dynamic Suggestion Removal */}
          <SmartField
            category="complaints"
            label="Chief Complaints"
            placeholder="Record chief complaint"
            value={complaintInput}
            onChange={setComplaintInput}
            onSelectTag={handleAddComplaint}
            excludeTags={complaintExcludeList}
            testId="input-complaint"
          />

          {/* Active Recorded Complaints (Single Line Horizontal Scroll in Whisper-Light Green) */}
          <div
            className="flex overflow-x-auto items-center gap-1.5 pb-0.5 ultra-thin-scrollbar h-7.5 max-h-7.5 min-h-[30px]"
            data-testid="complaints-tags-cloud"
          >
            {(assessment.complaints || []).length === 0 ? (
              <span className="text-xs text-slate-400 italic">No complaints recorded.</span>
            ) : (
              (assessment.complaints || []).map((item, idx) => {
                const label = typeof item === 'string' ? item : item.complaint;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold bg-emerald-50/30 text-emerald-950 border border-emerald-200/40 shadow-2xs shrink-0 whitespace-nowrap"
                    title={label}
                    data-testid={`complaint-tag-${idx}`}
                  >
                    <span className="truncate max-w-[200px]">{label}</span>
                    <button
                      type="button"
                      className="hover:text-rose-600 font-bold ml-0.5 transition-colors cursor-pointer"
                      onClick={() => handleRemoveComplaint(idx)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </span>
                );
              })
            )}
          </div>

          {/* Compact Duration: Sized only to the length required */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Overall Duration
            </label>
            <div className="flex items-center gap-2 max-w-[210px]">
              <input
                type="number"
                min="1"
                max="365"
                className="w-20 h-10 px-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all text-center font-semibold"
                value={assessment.duration_value ?? (parseInt(assessment.duration, 10) || 3)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  const unit = assessment.duration_unit || 'Days';
                  onChange({
                    ...assessment,
                    duration_value: val,
                    duration: `${val} ${unit}`,
                  });
                }}
                data-testid="input-duration-value"
              />
              <select
                className="flex-1 h-10 px-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs cursor-pointer transition-all"
                value={assessment.duration_unit || 'Days'}
                onChange={(e) => {
                  const unit = e.target.value;
                  const val = assessment.duration_value || 3;
                  onChange({
                    ...assessment,
                    duration_unit: unit,
                    duration: `${val} ${unit}`,
                  });
                }}
                data-testid="select-duration-unit"
              >
                {DURATION_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Diagnosis & Examination
           ========================================================================= */}
        <div className="space-y-2">
          {/* Smart Diagnosis Field with Dynamic Suggestion Removal */}
          <SmartField
            category="diagnoses"
            label="Provisional / Final Diagnosis"
            placeholder="Record diagnosis"
            value={diagnosisInput}
            onChange={setDiagnosisInput}
            onSelectTag={handleAddDiagnosis}
            excludeTags={assessment.diagnosis || []}
            testId="input-diagnosis"
          />

          {/* Active Recorded Diagnoses (Single Line Horizontal Scroll in Whisper-Light Green) */}
          <div
            className="flex overflow-x-auto items-center gap-1.5 pb-0.5 ultra-thin-scrollbar h-7.5 max-h-7.5 min-h-[30px]"
            data-testid="diagnosis-tags-cloud"
          >
            {(assessment.diagnosis || []).length === 0 ? (
              <span className="text-xs text-slate-400 italic">No diagnosis recorded.</span>
            ) : (
              (assessment.diagnosis || []).map((diag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold bg-emerald-50/30 text-emerald-950 border border-emerald-200/40 shadow-2xs shrink-0 whitespace-nowrap"
                  title={diag}
                  data-testid={`diagnosis-tag-${idx}`}
                >
                  <span className="truncate max-w-[200px]">{diag}</span>
                  <button
                    type="button"
                    className="hover:text-rose-600 font-bold ml-0.5 transition-colors cursor-pointer"
                    onClick={() => handleRemoveDiagnosis(idx)}
                    title="Remove"
                  >
                    &times;
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Physical Examination Textarea */}
          <div className="space-y-1 pt-1.5 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Physical &amp; Systemic Examination
            </label>
            <textarea
              className="w-full h-20 min-h-[80px] px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all resize-y"
              placeholder="Systemic examination findings"
              value={assessment.examination || ''}
              onChange={(e) =>
                onChange({ ...assessment, examination: e.target.value })
              }
              data-testid="input-examination"
            />
          </div>
        </div>
      </div>
      </div>
      )}
    </section>
  );
}
