import React, { useState } from 'react';

const COMMON_DIAGNOSES = [
  'Upper Respiratory Infection',
  'Acute Bronchitis',
  'Viral Pyrexia',
  'Gastroenteritis',
  'Type 2 Diabetes',
  'Essential Hypertension',
  'Dyspepsia',
  'Migraine',
];

const COMMON_COMPLAINTS = [
  'Fever',
  'Cough',
  'Cold',
  'Headache',
  'Body Ache',
  'Throat Pain',
  'Abdominal Pain',
  'Vomiting',
];

/**
 * ROW 1: Clinical Assessment (Split 50/50)
 * Left: Complaints & Duration
 * Right: Diagnosis & Examination
 */
export default function ClinicalAssessmentForm({
  assessment = {
    complaints: [],
    duration: '',
    diagnosis: [],
    examination: '',
  },
  onChange = () => {},
}) {
  const [complaintText, setComplaintText] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');

  const addComplaint = (c) => {
    const text = c || complaintText;
    if (!text.trim()) return;
    const current = assessment.complaints || [];
    const exists = current.some(
      (item) => (typeof item === 'string' ? item : item.complaint) === text.trim()
    );
    if (!exists) {
      onChange({
        ...assessment,
        complaints: [
          ...current,
          { complaint: text.trim(), duration: assessment.duration || '' },
        ],
      });
    }
    setComplaintText('');
  };

  const removeComplaint = (index) => {
    const current = assessment.complaints || [];
    onChange({
      ...assessment,
      complaints: current.filter((_, i) => i !== index),
    });
  };

  const addDiagnosis = (d) => {
    const text = d || diagnosisText;
    if (!text.trim()) return;
    const current = assessment.diagnosis || [];
    if (!current.includes(text.trim())) {
      onChange({
        ...assessment,
        diagnosis: [...current, text.trim()],
      });
    }
    setDiagnosisText('');
  };

  const removeDiagnosis = (index) => {
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
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Row 1: Clinical Assessment &amp; Findings
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN (50%): Complaints & Duration
           ========================================================================= */}
        <div className="space-y-3.5">
          {/* Complaints Input & Add Button */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chief Complaints
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
                placeholder="Type complaint e.g. High fever, headache..."
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addComplaint())
                }
                data-testid="input-complaint"
              />
              <button
                type="button"
                className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center"
                onClick={() => addComplaint()}
                data-testid="btn-add-complaint"
              >
                + Add
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMMON_COMPLAINTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-6 px-2.5 bg-slate-100/70 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200/70 text-slate-700 text-[11px] font-medium rounded-md transition-all cursor-pointer shadow-2xs flex items-center"
                  onClick={() => addComplaint(c)}
                  data-testid={`chip-complaint-${c.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  +{c}
                </button>
              ))}
            </div>

            {/* Active Complaints Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]" data-testid="complaints-tags-cloud">
              {(assessment.complaints || []).map((item, idx) => {
                const label = typeof item === 'string' ? item : item.complaint;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200/70 shadow-2xs"
                    data-testid={`complaint-tag-${idx}`}
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      className="hover:text-sky-950 font-bold ml-0.5 cursor-pointer"
                      onClick={() => removeComplaint(idx)}
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Duration (Applies to overall complaints) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overall Duration
            </label>
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
              placeholder="e.g. 3 days, 1 week, since yesterday..."
              value={assessment.duration || ''}
              onChange={(e) =>
                onChange({ ...assessment, duration: e.target.value })
              }
              data-testid="input-duration"
            />
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (50%): Diagnosis & Examination
           ========================================================================= */}
        <div className="space-y-3.5">
          {/* Diagnosis Input & Add Button */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Provisional / Final Diagnosis
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
                placeholder="Type diagnosis e.g. Acute Bronchitis..."
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addDiagnosis())
                }
                data-testid="input-diagnosis"
              />
              <button
                type="button"
                className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center"
                onClick={() => addDiagnosis()}
                data-testid="btn-add-diagnosis"
              >
                + Add
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {COMMON_DIAGNOSES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="h-6 px-2.5 bg-slate-100/70 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/70 text-slate-700 text-[11px] font-medium rounded-md transition-all cursor-pointer shadow-2xs flex items-center"
                  onClick={() => addDiagnosis(d)}
                  data-testid={`chip-diagnosis-${d.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  +{d}
                </button>
              ))}
            </div>

            {/* Active Diagnosis Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]" data-testid="diagnosis-tags-cloud">
              {(assessment.diagnosis || []).map((diag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs"
                  data-testid={`diagnosis-tag-${idx}`}
                >
                  <span>{diag}</span>
                  <button
                    type="button"
                    className="hover:text-emerald-950 font-bold ml-0.5 cursor-pointer"
                    onClick={() => removeDiagnosis(idx)}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Physical Examination Findings Textarea */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Physical &amp; Systemic Examination
            </label>
            <textarea
              className="w-full h-20 min-h-[80px] px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all resize-y"
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
