import React, { useState } from 'react';
import SmartField from './SmartField';

const FOLLOWUP_PERIODS = [
  { label: 'After 3 Days', days: 3, unit: 'Days' },
  { label: 'After 5 Days', days: 5, unit: 'Days' },
  { label: 'After 1 Week', days: 7, unit: 'Days' },
  { label: 'After 2 Weeks', days: 14, unit: 'Days' },
  { label: 'After 1 Month', days: 30, unit: 'Days' },
  { label: 'After 3 Months', days: 90, unit: 'Days' },
];

/**
 * PostPrescriptionRows Component
 * - Row 3: Diagnostic & Laboratory Investigations (Split 50/50)
 * - Row 4: Clinical Plan & Procedures (Split 33/33/33)
 * - Row 5: Advice, Follow-up & Doctor Billing
 * - Production-grade compact layout
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

  const handleFollowupPeriodChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + val);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      onChange({
        ...planAndBilling,
        for_followup: true,
        followup_duration: val,
        followup_date: formattedDate,
      });
    }
  };

  const invExcludeList = planAndBilling.investigations_next_visit || [];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          ROW 3: Diagnostic & Laboratory Investigations (Split 50/50)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-3-labs-investigations"
      >
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Diagnostic &amp; Laboratory Investigations
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Laboratory Reports (Read-Only) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Laboratory Reports
              </label>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                Read-Only
              </span>
            </div>
            <div
              className="w-full min-h-[96px] p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap select-text"
              data-testid="view-lab-reports-readonly"
            >
              {planAndBilling.lab_reports_reviewed || planAndBilling.lab_reports ? (
                <span>{planAndBilling.lab_reports_reviewed || planAndBilling.lab_reports}</span>
              ) : (
                <span className="text-slate-400 italic font-sans">
                  No verified laboratory reports attached for this visit.
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Investigations on Next Visit with SmartField */}
          <div className="flex flex-col gap-2">
            <SmartField
              category="investigations"
              label="Investigations on Next Visit"
              placeholder="Record investigation"
              value={invInput}
              onChange={setInvInput}
              onSelectTag={handleSelectInvestigation}
              excludeTags={invExcludeList}
              testId="input-investigation-text"
            />

            {/* Active Ordered Investigation Tags (Single Line Horizontal Scroll in Whisper-Light Green) */}
            <div
              className="flex overflow-x-auto items-center gap-1.5 pb-0.5 ultra-thin-scrollbar h-7.5 max-h-7.5 min-h-[30px]"
              data-testid="investigations-tags-cloud"
            >
              {(planAndBilling.investigations_next_visit || []).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No investigations scheduled.</span>
              ) : (
                (planAndBilling.investigations_next_visit || []).map((inv, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold bg-emerald-50/30 text-emerald-950 border border-emerald-200/40 shadow-2xs shrink-0 whitespace-nowrap"
                    title={inv}
                    data-testid={`investigation-tag-${idx}`}
                  >
                    <span className="truncate max-w-[200px]">{inv}</span>
                    <button
                      type="button"
                      className="hover:text-rose-600 font-bold ml-0.5 transition-colors cursor-pointer"
                      onClick={() => onRemoveInvestigation(inv)}
                      title="Remove"
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
          ROW 4: Clinical Plan & Procedures (Split in 3)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-4-clinical-plan"
      >
        <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Clinical Plan &amp; Procedures
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Procedure with SmartField */}
          <div className="flex flex-col gap-1.5">
            <SmartField
              category="procedures"
              label="Procedure Performed"
              placeholder="Record procedure"
              value={procInput}
              onChange={setProcInput}
              onSelectTag={handleSelectProcedure}
              testId="input-procedure-smart"
            />
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
              placeholder="Procedure details"
              value={planAndBilling.procedure || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, procedure: e.target.value })
              }
              data-testid="input-procedure"
            />
          </div>

          {/* Column 2: Referral with SmartField */}
          <div className="flex flex-col gap-1.5">
            <SmartField
              category="referrals"
              label="Specialist Referral"
              placeholder="Record referral"
              value={refInput}
              onChange={setRefInput}
              onSelectTag={handleSelectReferral}
              testId="input-referral-smart"
            />
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
              placeholder="Referral details"
              value={planAndBilling.referral || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, referral: e.target.value })
              }
              data-testid="input-referral"
            />
          </div>

          {/* Column 3: Internal Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Internal Notes
            </label>
            <textarea
              className="w-full h-[98px] px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all resize-y"
              placeholder="Internal doctor notes"
              value={planAndBilling.notes || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, notes: e.target.value })
              }
              data-testid="input-internal-notes"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROW 5: Dietary & Lifestyle Advice, Follow-up & Doctor Billing
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5"
        data-testid="row-5-advice-billing"
      >
        <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-100">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Advice, Follow-up &amp; Billing
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Dietary & Lifestyle Advice */}
          <div className="lg:col-span-5 flex flex-col gap-1.5">
            <SmartField
              category="advice"
              label="Dietary &amp; Lifestyle Advice"
              placeholder="Record advice"
              value={adviceInput}
              onChange={setAdviceInput}
              onSelectTag={handleSelectAdvice}
              testId="input-advice-smart"
            />
            <textarea
              className="w-full h-20 px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all resize-y"
              placeholder="Advice summary"
              value={planAndBilling.advice || ''}
              onChange={(e) =>
                onChange({ ...planAndBilling, advice: e.target.value })
              }
              data-testid="input-advice"
            />
          </div>

          {/* Middle Column (3 cols): Follow-up Schedule */}
          <div className="lg:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Follow-up Review
            </label>

            <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  checked={Boolean(planAndBilling.for_followup)}
                  onChange={(e) =>
                    onChange({
                      ...planAndBilling,
                      for_followup: e.target.checked,
                    })
                  }
                  data-testid="chk-for-followup"
                />
                <span className="text-xs font-semibold text-slate-700">Schedule Review</span>
              </label>

              {planAndBilling.for_followup && (
                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  <select
                    className="w-full h-10 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    defaultValue=""
                    onChange={handleFollowupPeriodChange}
                    data-testid="select-followup-quick"
                  >
                    <option value="" disabled>
                      Select interval...
                    </option>
                    {FOLLOWUP_PERIODS.map((period) => (
                      <option key={period.days} value={period.days}>
                        {period.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={planAndBilling.followup_date || ''}
                    onChange={(e) =>
                      onChange({
                        ...planAndBilling,
                        followup_date: e.target.value,
                      })
                    }
                    data-testid="input-followup-date"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Billing Breakdown */}
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Consultation Charges
            </label>

            <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-medium">Doctor Fee:</span>
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-8 pl-6 pr-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                    value={planAndBilling.doctor_fee || 0}
                    onChange={(e) =>
                      onChange({
                        ...planAndBilling,
                        doctor_fee: parseFloat(e.target.value) || 0,
                      })
                    }
                    data-testid="input-doctor-fee"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-medium">Dressing Fee:</span>
                <div className="relative w-28">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-8 pl-6 pr-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                    value={planAndBilling.dressing_fee || 0}
                    onChange={(e) =>
                      onChange({
                        ...planAndBilling,
                        dressing_fee: parseFloat(e.target.value) || 0,
                      })
                    }
                    data-testid="input-dressing-fee"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <strong className="text-xs font-bold text-slate-900 uppercase">Total Payable:</strong>
                <span
                  className="text-sm font-mono font-bold text-teal-800"
                  data-testid="panel-total-payable"
                >
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
