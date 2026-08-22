import React from 'react';

export default function PrescriptionFooter({
  planAndBilling = {},
  totalAmount = 0,
  onChange = () => {},
  onAction = () => {},
  saving = false,
}) {
  return (
    <footer className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-5 py-3 mt-6">
      {/* 1. Plan & Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        {/* Advice (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Dietary &amp; General Advice
          </label>
          <input
            type="text"
            className="w-full h-8.5 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-xs"
            placeholder="e.g., Drink plenty of warm fluids, Low salt diet, Rest for 2 days..."
            value={planAndBilling.advice || ''}
            onChange={(e) => onChange({ ...planAndBilling, advice: e.target.value })}
          />
        </div>

        {/* Follow-up Selector (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Follow-up Schedule
          </label>
          <div className="flex items-center gap-1.5">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                checked={Boolean(planAndBilling.for_followup)}
                onChange={(e) =>
                  onChange({ ...planAndBilling, for_followup: e.target.checked })
                }
              />
              <span>Review:</span>
            </label>

            <input
              type="number"
              min="1"
              className="w-14 h-8.5 px-2 text-center bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
              value={planAndBilling.followup_duration || 7}
              onChange={(e) =>
                onChange({
                  ...planAndBilling,
                  followup_duration: parseInt(e.target.value, 10) || 1,
                  for_followup: true,
                })
              }
            />

            <select
              className="h-8.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs cursor-pointer"
              value={planAndBilling.followup_unit || 'Days'}
              onChange={(e) =>
                onChange({ ...planAndBilling, followup_unit: e.target.value })
              }
            >
              <option value="Days">Days</option>
              <option value="Weeks">Weeks</option>
              <option value="Months">Months</option>
            </select>
          </div>
        </div>

        {/* Billing Breakdown (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Consultation &amp; Service Fees (₹)
          </label>
          <div className="flex items-center justify-end gap-2">
            <div className="inline-flex items-center gap-1.5 h-8.5 px-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-500">Doc:</span>
              <input
                type="number"
                className="w-14 h-full bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none"
                placeholder="0"
                value={planAndBilling.doctor_fee || ''}
                onChange={(e) =>
                  onChange({
                    ...planAndBilling,
                    doctor_fee: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="inline-flex items-center gap-1.5 h-8.5 px-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-500">Dressing:</span>
              <input
                type="number"
                className="w-14 h-full bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none"
                placeholder="0"
                value={planAndBilling.dressing_fee || ''}
                onChange={(e) =>
                  onChange({
                    ...planAndBilling,
                    dressing_fee: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="inline-flex items-center gap-1.5 h-8.5 px-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL:</span>
              <strong className="text-sm font-mono font-bold">₹{totalAmount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action Buttons Tray */}
      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 mt-2.5">
        {/* Secondary Status Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="h-8.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            onClick={() => onAction('pending')}
            disabled={saving}
          >
            Pending
          </button>
          <button
            type="button"
            className="h-8.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            onClick={() => onAction('reminder')}
            disabled={saving}
          >
            Reminder
          </button>
          <button
            type="button"
            className="h-8.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            onClick={() => onAction('not_visited')}
            disabled={saving}
          >
            Not Visited
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="h-9 px-4 bg-white hover:bg-teal-50 border border-teal-600 text-teal-700 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            onClick={() => onAction('save')}
            disabled={saving}
            data-testid="btn-save-prescription"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{saving ? 'Saving...' : 'SAVE'}</span>
          </button>

          <button
            type="button"
            className="h-9 px-4.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            onClick={() => onAction('print')}
            disabled={saving}
            data-testid="btn-print-prescription"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>PRINT PRESCRIPTION</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
