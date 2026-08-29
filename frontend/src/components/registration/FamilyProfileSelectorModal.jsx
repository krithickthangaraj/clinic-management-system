import React from 'react';
import { ClinicalBadge, MonospaceDataTag } from '../ui';

/**
 * FamilyProfileSelectorModal - Multi-Profile Family Identity Disambiguation Modal
 * Disambiguates shared phone numbers between parents, children, and spouses,
 * preventing accidental demographic overwriting.
 */
export default function FamilyProfileSelectorModal({
  isOpen = false,
  phone = '',
  profiles = [],
  onSelectProfile = () => {},
  onRegisterNewFamilyMember = () => {},
  onClose = () => {},
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transition-all duration-200">
        {/* 1. Header Ribbon */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <h3 id="family-modal-title" className="text-sm sm:text-base font-black text-white tracking-tight">
                Multiple Patients Found for This Phone
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Phone Number: <span className="font-bold text-teal-300">{phone}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 2. Patient Profile Cards Grid */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-600 font-medium">
            Select an existing patient profile to create a visit, or register a new family member under this shared contact:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((p) => {
              const name = p.name || p.full_name || 'Patient';
              const uhid = p.patient_id || `PAT-${p.id}`;
              const age = p.age || p.age_years || '—';
              const gender = p.gender || '—';

              return (
                <div
                  key={p.id || uhid}
                  onClick={() => onSelectProfile(p)}
                  className="bg-white hover:bg-teal-50/40 border border-slate-200 hover:border-teal-500 rounded-xl p-3.5 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-teal-100 font-bold text-slate-700 group-hover:text-teal-800 flex items-center justify-center text-xs shrink-0 transition-colors">
                      {name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900 truncate">
                        {name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span>{age} Y</span>
                        <span>•</span>
                        <span>{gender}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <MonospaceDataTag value={uhid} variant="teal" size="sm" />
                    <span className="text-teal-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Select <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Action: Register New Family Member */}
          <button
            type="button"
            onClick={onRegisterNewFamilyMember}
            className="w-full border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50 text-teal-800 text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Register as New Family Member (Same Phone)</span>
          </button>
        </div>

        {/* 4. Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
