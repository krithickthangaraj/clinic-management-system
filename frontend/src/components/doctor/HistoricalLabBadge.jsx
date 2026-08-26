import React from 'react';

/**
 * HistoricalLabBadge - Compact Lab Test Result Chip
 * Displays lab test name, value summary, and color-coded In-Range / Abnormal indicator.
 */
export default function HistoricalLabBadge({ lab = {} }) {
  const isAbnormal = Boolean(lab.is_abnormal);
  const testName = lab.test_name || lab.name || 'Lab Investigation';
  const summary = lab.result_summary || lab.value || lab.status || 'Completed';

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
        isAbnormal
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
      title={lab.result_summary || testName}
    >
      <div className="flex items-center gap-1.5 font-medium">
        <span className="font-semibold text-slate-900">{testName}:</span>
        <span className={isAbnormal ? 'font-bold text-rose-700' : 'text-emerald-700'}>
          {summary}
        </span>
      </div>

      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          isAbnormal
            ? 'bg-rose-200/80 text-rose-900'
            : 'bg-emerald-200/80 text-emerald-900'
        }`}
      >
        {isAbnormal ? 'Abnormal' : 'In-Range'}
      </span>

      {lab.result_url && (
        <a
          href={lab.result_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-slate-500 hover:text-slate-900 p-0.5"
          title="View Lab Report"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </a>
      )}
    </div>
  );
}
