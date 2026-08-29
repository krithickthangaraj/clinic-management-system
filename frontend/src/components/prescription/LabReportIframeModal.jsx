import React from 'react';

/**
 * LabReportIframeModal - On-Demand Diagnostic Report Modal with PDF Iframe & Structured Parameter Grid
 */
export default function LabReportIframeModal({
  isOpen = false,
  onClose = () => {},
  reportsSummary = '',
  orderedInvestigations = [],
  reportUrl = null,
  patientName = 'Patient',
  uhid = 'PAT-N/A',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center font-bold">
              🔬
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Verified Diagnostic Lab Reports</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-teal-300 border border-slate-700">
                  {uhid}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{patientName} &bull; Outpatient Laboratory Services</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-base cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 ultra-thin-scrollbar">
          {/* Summary Findings Chips */}
          {reportsSummary && (
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Laboratory Findings
              </h4>
              <div className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                {reportsSummary}
              </div>
            </div>
          )}

          {/* PDF Iframe Viewer if file attached */}
          {reportUrl ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs h-[500px]">
              <iframe
                src={reportUrl}
                title="Lab Report Document"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
              <span>Verified numeric parameter findings recorded above. No external PDF file attached for this visit.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
