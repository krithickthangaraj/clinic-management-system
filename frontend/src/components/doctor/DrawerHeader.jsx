import React from 'react';

/**
 * DrawerHeader - Demographic Banner & 44px Touch Close CTA
 */
export default function DrawerHeader({
  patientSummary = {},
  totalVisits = 0,
  onClose = () => {},
}) {
  const fullName = patientSummary.full_name || patientSummary.name || 'Patient Records';
  const age = patientSummary.age || patientSummary.age_years || '';
  const gender = patientSummary.gender || 'Unknown';
  const uhid = patientSummary.uhid || patientSummary.patient_id || 'UHID-N/A';

  // Compute initials
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PT';

  return (
    <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar Disc */}
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
          {initials}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm text-slate-900 truncate">
              {fullName}
            </h3>
            {totalVisits > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                {totalVisits} {totalVisits === 1 ? 'Visit' : 'Visits'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 truncate">
              {age ? `${age} Y` : ''} {age && gender ? '•' : ''} {gender} • {uhid}
            </span>
          </div>
        </div>
      </div>

      {/* 44px Touch Close Action Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
        title="Close History Drawer (Esc)"
        aria-label="Close"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
