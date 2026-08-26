import React from 'react';

/**
 * HistoricalMedicationItem - Individual historical drug row
 * Features clean dosage breakdown and 44px touch-accessible 'Copy to Current Rx' CTA.
 */
export default function HistoricalMedicationItem({
  med = {},
  onCopyRx = () => {},
  isCopied = false,
}) {
  const drugName = med.drug_name || med.name || 'Unnamed Medication';
  const dosage = med.dosage || med.dose || '';
  const frequency = med.frequency || '1-0-1';
  const duration = med.duration_days || med.days || med.duration;
  const timing = med.timing_notes || med.timing || med.instructions || 'After Food';

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-teal-50/40 hover:border-teal-200 transition-colors">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xs text-slate-900 truncate">{drugName}</span>
          {dosage && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-700">
              {dosage}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-teal-100/80 text-teal-800 border border-teal-200">
            {frequency}
          </span>
          {duration && (
            <span className="text-[11px] text-slate-500 font-medium">
              • {duration} Days
            </span>
          )}
        </div>
        {timing && (
          <span className="text-[11px] text-slate-500 mt-0.5 italic">
            {timing}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onCopyRx(med)}
        disabled={isCopied}
        className={`min-h-[44px] min-w-[110px] px-3 py-1.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer select-none shrink-0 ${
          isCopied
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 opacity-80 cursor-default'
            : 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100 hover:border-teal-400 active:bg-teal-200'
        }`}
        title="Copy medication into active prescription table"
      >
        {isCopied ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Added</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy to Rx</span>
          </>
        )}
      </button>
    </div>
  );
}
