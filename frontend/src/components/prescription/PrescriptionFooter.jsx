/**
 * ROW 6: Viewport Fixed Action Footer
 * Streamlined, high-efficiency OPD action bar:
 * - Compact height (h-9 elements) with rigid horizontal alignment
 * - Left: Live billing total & Auto-Save status indicator
 * - Right: Essential Clinical Actions (Not Visited, Mark Pending, Send to Lab, Print Prescription)
 */
export default function PrescriptionFooter({
  totalAmount = 0,
  onAction = () => {},
  saving = false,
}) {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl px-4 sm:px-6 py-2.5"
      data-testid="prescription-sticky-footer"
    >
      <div className="max-w-[1560px] mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Summary Total Indicator & Auto-Save Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 h-9 px-3.5 bg-teal-50 border border-teal-200/80 text-teal-900 rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 whitespace-nowrap">
              Total Payable:
            </span>
            <strong className="text-sm font-mono font-bold text-teal-950 whitespace-nowrap" data-testid="footer-total-amount">
              ₹{totalAmount}
            </strong>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-saved on every action
          </span>
        </div>

        {/* Right Side: Essential Streamlined Action Buttons (Rigid Horizontal Row) */}
        <div
          className="flex items-center gap-2.5 shrink-0 justify-end overflow-x-auto ultra-thin-scrollbar"
          data-testid="footer-actions-group"
        >
          {/* 1. Exception / No-Show Action */}
          <button
            type="button"
            className="h-9 px-3.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5 active:scale-95 shrink-0 whitespace-nowrap"
            onClick={() => onAction('not_visited')}
            disabled={saving}
            data-testid="btn-action-not-visited"
            title="Mark patient as No-Show / Cancelled"
          >
            <span>Not Visited</span>
          </button>

          {/* 2. Mark Pending (Intermediate Pause/Save) */}
          <button
            type="button"
            className="h-9 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            onClick={() => onAction('pending')}
            disabled={saving}
            data-testid="btn-save-prescription"
            title="Save consultation draft & keep patient pending in queue (Ctrl + Enter)"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-300 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{saving ? 'Saving...' : 'MARK PENDING'}</span>
            <span className="hidden lg:inline text-[9px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">
              ⌘↵
            </span>
          </button>

          {/* 3. Send to Lab / Hold (Diagnostic Pathway) */}
          <button
            type="button"
            className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            onClick={() => onAction('send_to_lab')}
            disabled={saving}
            data-testid="btn-action-send-to-lab"
            title="Save assessment, order investigations & put patient on hold for Lab processing"
          >
            <svg className="w-3.5 h-3.5 text-amber-100 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-10.127A2 2 0 0 1 14 9.527V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
            </svg>
            <span>SEND TO LAB / HOLD</span>
          </button>

          {/* 4. Print & Finalize (Primary OPD Action) */}
          <button
            type="button"
            className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            onClick={() => onAction('print')}
            disabled={saving}
            data-testid="btn-print-prescription"
            title="Auto-save, finalize visit as COMPLETED and open printable prescription"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
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
