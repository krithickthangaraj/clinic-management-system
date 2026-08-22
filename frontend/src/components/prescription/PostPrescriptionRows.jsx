import { useState } from 'react';
import SmartCombobox from './SmartCombobox';

/**
 * Post-Prescription Diagnostic, Clinical Plan & Billing Modules
 * - Diagnostic & Laboratory Investigations (Split 50/50)
 * - Clinical Plan & Procedures (Split in 3: Procedure, Referral, Notes)
 * - Dietary Advice, Follow-up & Fee Breakdown
 */
export default function PostPrescriptionRows({
  planAndBilling = {},
  totalAmount = 0,
  onChange = () => {},
  onAddInvestigation = () => {},
  onRemoveInvestigation = () => {},
}) {
  const [invInput, setInvInput] = useState('');
  const [procInput, setProcInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [adviceInput, setAdviceInput] = useState('');

  const handleSelectInvestigation = (item) => {
    onAddInvestigation(item);
  };

  const handleSelectProcedure = (item) => {
    const current = planAndBilling.procedure || '';
    onChange({
      ...planAndBilling,
      procedure: current ? `${current}, ${item}` : item,
    });
  };

  const handleSelectReferral = (item) => {
    onChange({
      ...planAndBilling,
      referral: item,
    });
  };

  const handleSelectAdvice = (item) => {
    const current = planAndBilling.advice || '';
    onChange({
      ...planAndBilling,
      advice: current ? `${current}. ${item}` : item,
    });
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. Diagnostic & Laboratory Investigations (Split 50/50)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-3-labs-investigations"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Diagnostic &amp; Laboratory Investigations
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Global investigation dictionary active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Laboratory Reports Reviewed */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
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

          {/* Right Column: Investigations on Next Visit with SmartCombobox */}
          <div className="flex flex-col gap-2">
            <SmartCombobox
              category="investigations"
              label="Investigations on Next Visit"
              placeholder="Type investigation (e.g. CBC, HbA1c)..."
              value={invInput}
              onChange={setInvInput}
              onSelectTag={handleSelectInvestigation}
              testId="input-investigation-text"
            />

            {/* Active Ordered Investigation Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1 min-h-[26px]" data-testid="investigations-tags-cloud">
              {(planAndBilling.investigations_next_visit || []).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No investigations scheduled.</span>
              ) : (
                (planAndBilling.investigations_next_visit || []).map((inv, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 max-w-[260px] px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/70 shadow-2xs"
                    title={inv}
                    data-testid={`investigation-tag-${idx}`}
                  >
                    <span className="truncate">{inv}</span>
                    <button
                      type="button"
                      className="hover:text-indigo-950 font-bold ml-0.5 cursor-pointer shrink-0"
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
          2. Clinical Plan & Procedures (Split in 3)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-4-clinical-plan"
      >
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Clinical Plan &amp; Procedures
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Procedure with SmartCombobox */}
          <div className="flex flex-col gap-1.5">
            <SmartCombobox
              category="procedures"
              label="Procedure Performed"
              placeholder="e.g. Wound dressing..."
              value={procInput}
              onChange={setProcInput}
              onSelectTag={handleSelectProcedure}
              testId="input-procedure-combo"
              showAddButton={false}
            />
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
              placeholder="Selected procedures summary..."
              value={planAndBilling.procedure || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, procedure: e.target.value })
              }
              data-testid="input-procedure"
            />
          </div>

          {/* Column 2: Referral with SmartCombobox */}
          <div className="flex flex-col gap-1.5">
            <SmartCombobox
              category="referrals"
              label="Specialist Referral"
              placeholder="e.g. Cardiologist for Echo..."
              value={refInput}
              onChange={setRefInput}
              onSelectTag={handleSelectReferral}
              testId="input-referral-combo"
              showAddButton={false}
            />
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
              placeholder="Referral details / doctor name..."
              value={planAndBilling.referral || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, referral: e.target.value })
              }
              data-testid="input-referral"
            />
          </div>

          {/* Column 3: Internal Notes */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Clinical &amp; Internal Notes
              </label>
              <span className="text-[10px] text-slate-400">Confidential</span>
            </div>
            <textarea
              className="w-full h-22 px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all resize-y"
              placeholder="Private doctor's notes / dressing notes..."
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
          3. Dietary Advice, Follow-up & Fee Breakdown
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-5-closing-billing"
      >
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Dietary Advice, Follow-up &amp; Fee Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Advice (4 Cols) with SmartCombobox */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <SmartCombobox
              category="advice"
              label="Dietary & General Advice"
              placeholder="e.g. Low salt diet..."
              value={adviceInput}
              onChange={setAdviceInput}
              onSelectTag={handleSelectAdvice}
              testId="input-advice-combo"
              showAddButton={false}
            />
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
              placeholder="Combined advice summary..."
              value={planAndBilling.advice || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, advice: e.target.value })
              }
              data-testid="input-advice"
            />
          </div>

          {/* Follow-up Schedule (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Follow-up Review Schedule
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg h-10">
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
                className="w-14 h-7 px-1.5 text-center bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs"
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
                className="h-7 px-2 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
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
                className="h-7 px-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
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
