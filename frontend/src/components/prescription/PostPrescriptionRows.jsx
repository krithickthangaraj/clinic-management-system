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

/**
 * ROW 3: Labs & Investigations (Split 50/50)
 * ROW 4: Clinical Plan (Split in 3: Procedure, Referral, Notes)
 * ROW 5: Closing, Advice & Billing
 */
export default function PostPrescriptionRows({
  planAndBilling = {},
  totalAmount = 0,
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
    <div className="space-y-6">
      {/* =========================================================================
          ROW 3: Labs & Investigations (Split 50/50)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-3-labs-investigations"
      >
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Row 3: Laboratory &amp; Diagnostic Investigations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column (50%): Laboratory Reports */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Laboratory Reports Reviewed
              </label>
              <span className="text-[10px] font-medium text-slate-400">Current / Past</span>
            </div>
            <textarea
              className="w-full h-24 px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all resize-y"
              placeholder="e.g. Hb: 12.8, Platelets: 2.4L, Sugar: 142 mg/dL, Normal ECG..."
              value={planAndBilling.lab_reports_reviewed || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, lab_reports_reviewed: e.target.value })
              }
              data-testid="input-lab-reports"
            />
          </div>

          {/* Right Column (50%): Investigations on Next Visit */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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

            {/* Active Ordered Investigation Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]" data-testid="investigations-tags-cloud">
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
        </div>
      </section>

      {/* =========================================================================
          ROW 4: Clinical Plan (Split in 3)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-4-clinical-plan"
      >
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Row 4: Clinical Plan &amp; Procedures
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Procedure */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
            <div className="flex flex-wrap gap-1 pt-1">
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

          {/* Column 2: Referral */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
            <span className="text-[11px] text-slate-400 italic">
              Specify consultant name &amp; purpose.
            </span>
          </div>

          {/* Column 3: Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Clinical &amp; Internal Notes
            </label>
            <textarea
              className="w-full h-20 px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all resize-y"
              placeholder="Private doctor's notes / precautions / dressing notes..."
              value={planAndBilling.notes || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, notes: e.target.value })
              }
              data-testid="input-notes"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROW 5: Closing, Advice & Billing
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-5-closing-billing"
      >
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Row 5: Dietary Advice, Follow-up &amp; Fee Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Advice (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dietary &amp; General Advice
            </label>
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
              placeholder="e.g. Low salt diet, drink warm water, avoid oily food..."
              value={planAndBilling.advice || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, advice: e.target.value })
              }
              data-testid="input-advice"
            />
          </div>

          {/* Follow-up Controls (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-up Review Schedule
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                  checked={Boolean(planAndBilling.for_followup)}
                  onChange={(e) =>
                    onChange({
                      ...planAndBilling,
                      for_followup: e.target.checked,
                    })
                  }
                  data-testid="checkbox-followup"
                />
                <span>Review:</span>
              </label>

              <input
                type="number"
                min="1"
                className="w-14 h-8 px-2 text-center bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                value={planAndBilling.followup_duration || 7}
                onChange={(e) =>
                  onChange({
                    ...planAndBilling,
                    followup_duration: parseInt(e.target.value, 10) || 1,
                    for_followup: true,
                  })
                }
                data-testid="input-followup-duration"
              />

              <select
                className="h-8 px-2 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs cursor-pointer"
                value={planAndBilling.followup_unit || 'Days'}
                onChange={(e) =>
                  onChange({ ...planAndBilling, followup_unit: e.target.value })
                }
                data-testid="select-followup-unit"
              >
                <option value="Days">Days</option>
                <option value="Weeks">Weeks</option>
                <option value="Months">Months</option>
              </select>

              <input
                type="date"
                className="h-8 px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                value={planAndBilling.followup_date || ''}
                onChange={(e) =>
                  onChange({
                    ...planAndBilling,
                    followup_date: e.target.value,
                    for_followup: true,
                  })
                }
                data-testid="input-followup-date"
              />
            </div>
          </div>

          {/* Fees Breakdown (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consultation &amp; Service Fees (₹)
            </label>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-lg flex-1">
                <span className="text-xs font-semibold text-slate-500">Doc:</span>
                <input
                  type="number"
                  className="w-full bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none text-right"
                  placeholder="0"
                  value={planAndBilling.doctor_fee || ''}
                  onChange={(e) =>
                    onChange({
                      ...planAndBilling,
                      doctor_fee: parseFloat(e.target.value) || 0,
                    })
                  }
                  data-testid="input-doc-fee"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-lg flex-1">
                <span className="text-xs font-semibold text-slate-500">Dress:</span>
                <input
                  type="number"
                  className="w-full bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none text-right"
                  placeholder="0"
                  value={planAndBilling.procedure_fee || planAndBilling.dressing_fee || ''}
                  onChange={(e) =>
                    onChange({
                      ...planAndBilling,
                      procedure_fee: parseFloat(e.target.value) || 0,
                    })
                  }
                  data-testid="input-proc-fee"
                />
              </div>

              <div className="inline-flex items-center gap-2 h-10 px-3.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg shrink-0 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL:</span>
                <strong className="text-sm font-mono font-bold" data-testid="label-total-amount">
                  ₹{totalAmount}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
