import React, { useState } from 'react';
import { ClinicalBadge, TactileButton } from '../ui';

/**
 * InlineLabReportViewer - Doctor Desk Investigation Sync Ribbon
 * Renders structured lab parameter findings, abnormal flags, and 1-click PDF view.
 */
export default function InlineLabReportViewer({
  reportsSummary = '',
  orderedInvestigations = [],
  reportUrl = null,
  completedAt = null,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  if (!reportsSummary && orderedInvestigations.length === 0) {
    return null;
  }

  // Parse structured chips from summary string
  // Formats like: "Hb: 10.2 g/dL [Low] • WBC: 12,500 [High] • Platelets: 2.4L [Normal]" or "Hb: 11.3 g/dL (H), Creat: 0.65 mg/dL"
  const rawParts = reportsSummary
    ? reportsSummary.split(/[•\n,]/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div
      className="bg-teal-50/50 border border-teal-200/80 rounded-2xl p-4 shadow-2xs space-y-3 transition-all"
      data-testid="inline-lab-report-viewer"
    >
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            🧪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-teal-950">
                Verified Laboratory Findings
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Results Ready
              </span>
            </div>
            <span className="text-[11px] text-teal-700/80 font-medium">
              {orderedInvestigations.length > 0
                ? orderedInvestigations.join(', ')
                : 'Diagnostic Lab Panel'}
              {completedAt && ` • Verified at ${new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reportUrl && (
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-white hover:bg-teal-100/70 border border-teal-300 rounded-xl px-3 py-1.5 transition-colors shadow-2xs"
            >
              <span>📄</span>
              <span>View PDF Report</span>
            </button>
          )}

          {rawParts.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-100/50 px-2.5 py-1.5 rounded-xl border border-teal-200 transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Details'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Structured Parameter Chips Cloud */}
      {rawParts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {rawParts.map((part, idx) => {
            const isLow = part.toLowerCase().includes('low') || part.includes('↓');
            const isHigh = part.toLowerCase().includes('high') || part.includes('↑') || part.includes('(h)');
            const isCritical = part.toLowerCase().includes('critical');
            const isAbnormal = isLow || isHigh || isCritical;

            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-transform select-none ${
                  isCritical
                    ? 'bg-rose-100 text-rose-950 border border-rose-300 ring-1 ring-inset ring-rose-500/20'
                    : isHigh
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : isLow
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-white text-slate-800 border border-teal-200/80 shadow-2xs'
                }`}
              >
                {isCritical && <span>🚨</span>}
                {isHigh && <span className="text-amber-700">↑</span>}
                {isLow && <span className="text-amber-700">↓</span>}
                <span>{part}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* 3. Expanded Full Parameter Table */}
      {isExpanded && rawParts.length > 0 && (
        <div className="bg-white rounded-xl border border-teal-200/60 p-3 mt-2 overflow-hidden animate-fadeIn">
          <div className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider mb-2">
            Complete Diagnostic Summary
          </div>
          <div className="text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {reportsSummary}
          </div>
        </div>
      )}

      {/* 4. PDF Preview Modal */}
      {showPdfModal && reportUrl && (
        <div className="fixed inset-0 z-[1050] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Official Diagnostic Laboratory Report</span>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <iframe src={reportUrl} title="Lab Report PDF" className="flex-1 w-full h-full border-none" />
          </div>
        </div>
      )}
    </div>
  );
}
