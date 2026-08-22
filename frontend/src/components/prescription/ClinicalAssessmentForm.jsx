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
    <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Chief Complaints Column */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Chief Complaints &amp; Duration
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-xs"
              placeholder="Type complaint e.g., High fever for 3 days..."
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addComplaint())
              }
            />
            <button
              type="button"
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-2xs shrink-0"
              onClick={() => addComplaint()}
            >
              + Add
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_COMPLAINTS.map((c) => (
              <button
                key={c}
                type="button"
                className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md transition-all cursor-pointer shadow-2xs"
                onClick={() => addComplaint(c)}
              >
                +{c}
              </button>
            ))}
          </div>

          {/* Active Complaints Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
            {(assessment.complaints || []).map((item, idx) => {
              const label = typeof item === 'string' ? item : item.complaint;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    className="hover:text-sky-950 font-bold ml-0.5"
                    onClick={() => removeComplaint(idx)}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* 2. Clinical Diagnosis Column */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Provisional / Final Diagnosis
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-xs"
              placeholder="Type diagnosis e.g., Acute Bronchitis..."
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addDiagnosis())
              }
            />
            <button
              type="button"
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-2xs shrink-0"
              onClick={() => addDiagnosis()}
            >
              + Add
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_DIAGNOSES.map((d) => (
              <button
                key={d}
                type="button"
                className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md transition-all cursor-pointer shadow-2xs"
                onClick={() => addDiagnosis(d)}
              >
                +{d}
              </button>
            ))}
          </div>

          {/* Active Diagnosis Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]">
            {(assessment.diagnosis || []).map((diag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
              >
                <span>{diag}</span>
                <button
                  type="button"
                  className="hover:text-emerald-950 font-bold ml-0.5"
                  onClick={() => removeDiagnosis(idx)}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Physical Examination Findings */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Physical Examination Findings
        </label>
        <textarea
          className="w-full h-18 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-xs resize-y"
          placeholder="Systemic examination: Chest clear, Throat congested, Soft abdomen, No pallor/edema..."
          value={assessment.examination || ''}
          onChange={(e) => onChange({ ...assessment, examination: e.target.value })}
        />
      </div>
    </section>
  );
}
