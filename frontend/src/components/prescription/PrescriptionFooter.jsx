
/**
 * ROW 6: Viewport Fixed Action Footer
 * Fixed at bottom of screen with action buttons aligned to the right
 */
export default function PrescriptionFooter({
  totalAmount = 0,
  onAction = () => {},
  saving = false,
}) {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl px-6 py-3.5"
      data-testid="prescription-sticky-footer"
    >
      <div className="max-w-[1560px] mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Summary Total Indicator */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 h-10 px-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Total Consultation Payable:
            </span>
            <strong className="text-base font-mono font-bold" data-testid="footer-total-amount">
              ₹{totalAmount}
            </strong>
          </div>
          <span className="hidden md:inline text-xs text-slate-400 font-medium">
            &bull; All changes autosaved locally
          </span>
        </div>

        {/* Right Side: Action Buttons Tray */}
        <div
          className="flex items-center gap-2.5 flex-wrap justify-end"
          data-testid="footer-actions-group"
        >
          {/* Secondary Status Trays */}
          <button
            type="button"
            className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            onClick={() => onAction('not_visited')}
            disabled={saving}
            data-testid="btn-action-not-visited"
          >
            NOT VISITED
          </button>

          <button
            type="button"
            className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            onClick={() => onAction('followup')}
            disabled={saving}
            data-testid="btn-action-followup"
          >
            FOLLOWUP
          </button>

          <button
            type="button"
            className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            onClick={() => onAction('reminder')}
            disabled={saving}
            data-testid="btn-action-reminder"
          >
            REMINDER
          </button>

          <button
            type="button"
            className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            onClick={() => onAction('pending')}
            disabled={saving}
            data-testid="btn-action-pending"
          >
            PENDING
          </button>

          {/* Send to Lab / Hold Button */}
          <button
            type="button"
            className="h-10 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            onClick={() => onAction('send_to_lab')}
            disabled={saving}
            data-testid="btn-action-send-to-lab"
            title="Send patient to lab & put on hold"
          >
            <svg className="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-10.127A2 2 0 0 1 14 9.527V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
            </svg>
            <span>SEND TO LAB / HOLD</span>
          </button>

          {/* Primary Save Button */}
          <button
            type="button"
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            onClick={() => onAction('save')}
            disabled={saving}
            data-testid="btn-save-prescription"
            title="Save Prescription (Ctrl + Enter)"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{saving ? 'Saving...' : 'SAVE'}</span>
            <span className="hidden md:inline text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
              ⌘↵
            </span>
          </button>

          {/* Primary Print Button */}
          <button
            type="button"
            className="h-10 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            onClick={() => onAction('print')}
            disabled={saving}
            data-testid="btn-print-prescription"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
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
