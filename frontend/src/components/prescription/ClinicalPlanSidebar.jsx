import React, { useState } from 'react';

const COMMON_INVESTIGATIONS = [
  'CBC',
  'HbA1c',
  'Lipid Profile',
  'LFT',
  'RFT / Creatinine',
  'FBS / PPBS',
  'USG Abdomen',
  'ECG (12 Lead)',
  'Chest X-Ray PA',
  'Urine Routine',
  'Thyroid (TSH)',
];

const COMMON_PROCEDURES = [
  'Wound Dressing',
  'Nebulization',
  'Suturing',
  'I&D',
  'Ear Syringing',
  'Catheterization',
];

export default function ClinicalPlanSidebar({
  planAndBilling = {},
  onChange = () => {},
  onAddInvestigation = () => {},
  onRemoveInvestigation = () => {},
}) {
  const [investigationInput, setInvestigationInput] = useState('');

  const handleAddInv = (e) => {
    e?.preventDefault?.();
    if (investigationInput.trim()) {
      onAddInvestigation(investigationInput.trim());
      setInvestigationInput('');
    }
  };

  return (
    <aside className="space-y-5" data-testid="clinical-plan-sidebar">
      {/* 1. Lab Reports Card (p-5 Standardized) */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-xs p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Laboratory Reports Reviewed
          </label>
          <span className="text-[10px] font-medium text-slate-400">Current / Past</span>
        </div>
        <textarea
          className="w-full h-18 px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all resize-y"
          placeholder="e.g. Hb: 12.8, Platelets: 2.4L, Sugar: 142 mg/dL, Normal ECG..."
          value={planAndBilling.lab_reports_reviewed || ''}
          onChange={(e) =>
            onChange({ ...planAndBilling, lab_reports_reviewed: e.target.value })
          }
          data-testid="input-lab-reports"
        />
      </div>

      {/* 2. Investigations on Next Visit Card (p-5 Standardized) */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Investigations on Next Visit
          </label>
          <span
            className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60"
            data-testid="investigations-count-badge"
          >
            {(planAndBilling.investigations_next_visit || []).length} Ordered
          </span>
        </div>

        {/* Input & Add (Standardized h-10) */}
        <form className="flex items-center gap-2" onSubmit={handleAddInv}>
          <input
            type="text"
            className="flex-1 h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
            placeholder="Type investigation (e.g. CBC)..."
            value={investigationInput}
            onChange={(e) => setInvestigationInput(e.target.value)}
            data-testid="input-investigation-text"
          />
          <button
            type="submit"
            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 flex items-center justify-center"
            data-testid="btn-add-investigation"
          >
            + Add
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {COMMON_INVESTIGATIONS.map((inv) => (
            <button
              key={inv}
              type="button"
              className="h-6 px-2.5 bg-slate-100/70 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200/70 text-slate-700 text-[10px] font-medium rounded transition-all cursor-pointer shadow-2xs flex items-center"
              onClick={() => onAddInvestigation(inv)}
              data-testid={`chip-inv-${inv.toLowerCase().replace(/[\s/()]+/g, '-')}`}
            >
              +{inv}
            </button>
          ))}
        </div>

        {/* Active Investigation Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1 min-h-[24px]" data-testid="investigations-tags-cloud">
          {(planAndBilling.investigations_next_visit || []).length === 0 ? (
            <span className="text-xs text-slate-400 italic">No investigations scheduled.</span>
          ) : (
            (planAndBilling.investigations_next_visit || []).map((inv, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/70 shadow-2xs"
                data-testid={`investigation-tag-${idx}`}
              >
                <span>{inv}</span>
                <button
                  type="button"
                  className="hover:text-indigo-950 font-bold ml-0.5 cursor-pointer"
                  onClick={() => onRemoveInvestigation(inv)}
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* 3. Procedure, Referral & Notes Card (p-5 Standardized) */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-xs p-5 space-y-3.5">
        {/* Procedure */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Procedure Performed
          </label>
          <input
            type="text"
            className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
            placeholder="e.g. Wound dressing, Nebulization..."
            value={planAndBilling.procedure || ''}
            onChange={(e) =>
              onChange({ ...planAndBilling, procedure: e.target.value })
            }
            data-testid="input-procedure"
          />
          {/* Quick Procedure Chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {COMMON_PROCEDURES.map((p) => (
              <button
                key={p}
                type="button"
                className="h-5 px-2 bg-slate-100/70 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[10px] font-medium rounded transition-all cursor-pointer flex items-center"
                onClick={() =>
                  onChange({
                    ...planAndBilling,
                    procedure: planAndBilling.procedure
                      ? `${planAndBilling.procedure}, ${p}`
                      : p,
                  })
                }
                data-testid={`chip-proc-${p.toLowerCase().replace(/[\s&/]+/g, '-')}`}
              >
                +{p}
              </button>
            ))}
          </div>
        </div>

        {/* Referral */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Specialist Referral
          </label>
          <input
            type="text"
            className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
            placeholder="e.g. Cardiologist for Echo, ENT Specialist..."
            value={planAndBilling.referral || ''}
            onChange={(e) =>
              onChange({ ...planAndBilling, referral: e.target.value })
            }
            data-testid="input-referral"
          />
        </div>

        {/* Clinical / Internal Notes */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Internal Clinical Notes
          </label>
          <textarea
            className="w-full h-16 px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all resize-y"
            placeholder="Doctor's private notes / precautions..."
            value={planAndBilling.notes || ''}
            onChange={(e) =>
              onChange({ ...planAndBilling, notes: e.target.value })
            }
            data-testid="input-notes"
          />
        </div>
      </div>
    </aside>
  );
}
