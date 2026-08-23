import React, { useState, useMemo } from 'react';
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
  laboratoryReports = '',
  onChange = () => {},
  onAddInvestigation = () => {},
  onRemoveInvestigation = () => {},
}) {
  const [isLabOpen, setIsLabOpen] = useState(true);
  const [isPlanOpen, setIsPlanOpen] = useState(true);
  const [isBillingOpen, setIsBillingOpen] = useState(true);

  const [invInput, setInvInput] = useState('');
  const [procInput, setProcInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [adviceInput, setAdviceInput] = useState('');

  const displayReports = (
    planAndBilling.lab_reports_reviewed ||
    planAndBilling.lab_reports ||
    laboratoryReports ||
    ''
  ).trim();

  // Split multiple test results for structured visualization if comma-separated
  const reportItems = useMemo(() => {
    if (!displayReports) return [];
    return displayReports
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [displayReports]);

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
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
        data-testid="row-3-labs-investigations"
      >
        <div
          className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
          onClick={() => setIsLabOpen(!isLabOpen)}
          role="button"
          tabIndex={0}
          aria-expanded={isLabOpen}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diagnostic &amp; Laboratory Investigations
            </h3>
            {displayReports && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Lab Findings Verified</span>
              </span>
            )}
            {(planAndBilling.investigations_next_visit || []).length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                {(planAndBilling.investigations_next_visit || []).length} Ordered
              </span>
            )}
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Toggle laboratory investigations panel"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isLabOpen ? 'rotate-180' : ''}`}
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

        {isLabOpen && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Laboratory Reports (Scrollable) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Laboratory Reports
                  </label>
                  {displayReports && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {reportItems.length} test{reportItems.length > 1 ? 's' : ''} recorded
                    </span>
                  )}
                </div>
                <div
                  className={`w-full max-h-[175px] min-h-[96px] overflow-y-auto p-2.5 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap select-text border transition-colors ultra-thin-scrollbar ${
                    displayReports
                      ? 'bg-slate-50/90 border-teal-200/80 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/70 text-slate-400 italic font-sans flex items-center justify-center'
                  }`}
                  data-testid="view-lab-reports-readonly"
                >
                  {displayReports ? (
                    <div className="space-y-1.5 font-sans">
                      {reportItems.map((item, idx) => {
                        const isAbnormal = item.includes('(H)') || item.toLowerCase().includes('abnormal');
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-xs font-medium ${
                              isAbnormal
                                ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
                                : 'bg-white border-slate-200/80 text-slate-800'
                            }`}
                          >
                            <span className="font-mono text-xs">{item}</span>
                            {isAbnormal && (
                              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-600 text-white rounded uppercase tracking-wider">
                                Abnormal
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span>No verified laboratory reports attached for this visit.</span>
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
          </div>
        )}
      </section>

      {/* =========================================================================
          ROW 4: Clinical Plan & Procedures (Split in 3)
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
        data-testid="row-4-clinical-plan"
      >
        <div
          className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
          onClick={() => setIsPlanOpen(!isPlanOpen)}
          role="button"
          tabIndex={0}
          aria-expanded={isPlanOpen}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Clinical Plan &amp; Procedures
            </h3>
            {planAndBilling.procedure && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs truncate max-w-[160px]">
                Proc: {planAndBilling.procedure}
              </span>
            )}
            {planAndBilling.referral && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/70 shadow-2xs truncate max-w-[160px]">
                Ref: {planAndBilling.referral}
              </span>
            )}
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Toggle clinical plan panel"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isPlanOpen ? 'rotate-180' : ''}`}
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

        {isPlanOpen && (
          <div className="p-5">
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
          </div>
        )}
      </section>

      {/* =========================================================================
          ROW 5: Dietary & Lifestyle Advice, Follow-up & Doctor Billing
         ========================================================================= */}
      <section
        className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
        data-testid="row-5-advice-billing"
      >
        <div
          className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
          onClick={() => setIsBillingOpen(!isBillingOpen)}
          role="button"
          tabIndex={0}
          aria-expanded={isBillingOpen}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Advice, Follow-up &amp; Billing
            </h3>
            {planAndBilling.for_followup && planAndBilling.followup_date && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                Review: {planAndBilling.followup_date}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200/70 shadow-2xs">
              Fee: ₹{totalAmount}
            </span>
          </div>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Toggle advice and billing panel"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isBillingOpen ? 'rotate-180' : ''}`}
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

        {isBillingOpen && (
          <div className="p-5">
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
          </div>
        )}
      </section>
    </div>
  );
}
