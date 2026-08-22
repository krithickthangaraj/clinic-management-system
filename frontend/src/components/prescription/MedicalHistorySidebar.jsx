import React, { useState } from 'react';

export default function MedicalHistorySidebar({
  history = {
    allergy_history: [],
    past_history: [],
    surgical_history: [],
    family_history: [],
    personal_history: [],
  },
  onAddTag = () => {},
  onRemoveTag = () => {},
}) {
  const [isOpen, setIsOpen] = useState(
    Boolean(
      history.allergy_history?.length ||
        history.past_history?.length ||
        history.surgical_history?.length
    )
  );

  const [activeSection, setActiveSection] = useState('allergy_history');
  const [tagInput, setTagInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (tagInput.trim()) {
      onAddTag(activeSection, tagInput.trim());
      setTagInput('');
    }
  };

  const totalHistoryCount =
    (history.allergy_history?.length || 0) +
    (history.past_history?.length || 0) +
    (history.surgical_history?.length || 0) +
    (history.family_history?.length || 0);

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/70 shadow-xs overflow-hidden"
      data-testid="medical-history-card"
    >
      {/* 1. Accordion Header Bar */}
      <div
        className="px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        data-testid="btn-toggle-history"
      >
        <div className="flex items-center gap-2.5">
          <svg
            className="w-4 h-4 text-slate-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            Patient Medical History
          </span>
          {totalHistoryCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
              {totalHistoryCount} Records
            </span>
          )}
          {history.allergy_history?.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
              {history.allergy_history.length} Allergies
            </span>
          )}
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center"
          aria-label="Toggle history panel"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
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

      {/* 2. Accordion Body */}
      {isOpen && (
        <div className="p-5 space-y-3.5 bg-white" data-testid="history-body">
          {/* Segmented Section Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto">
            <button
              type="button"
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center transition-all ${
                activeSection === 'allergy_history'
                  ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200/80 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
              onClick={() => setActiveSection('allergy_history')}
              data-testid="tab-allergy"
            >
              Allergies ({history.allergy_history?.length || 0})
            </button>
            <button
              type="button"
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center transition-all ${
                activeSection === 'past_history'
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
              onClick={() => setActiveSection('past_history')}
              data-testid="tab-past"
            >
              Past ({history.past_history?.length || 0})
            </button>
            <button
              type="button"
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center transition-all ${
                activeSection === 'surgical_history'
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
              onClick={() => setActiveSection('surgical_history')}
            >
              Surgical ({history.surgical_history?.length || 0})
            </button>
            <button
              type="button"
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center transition-all ${
                activeSection === 'family_history'
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
              onClick={() => setActiveSection('family_history')}
            >
              Family ({history.family_history?.length || 0})
            </button>
          </div>

          {/* Quick Tag Add Input Row (Standardized h-10) */}
          <form className="flex items-center gap-2" onSubmit={handleAdd}>
            <input
              type="text"
              className="flex-1 h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
              placeholder={`Add to ${activeSection.replace('_', ' ')} (e.g. Penicillin)...`}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              data-testid="input-history-tag"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
              data-testid="btn-add-history-tag"
            >
              + Add
            </button>
          </form>

          {/* Active Tags Cloud */}
          <div className="flex flex-wrap items-center gap-2 min-h-[26px]" data-testid="history-tags-cloud">
            {(history[activeSection] || []).length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No recorded items in this section.
              </span>
            ) : (
              (history[activeSection] || []).map((tag, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-2xs ${
                    activeSection === 'allergy_history'
                      ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                      : 'bg-slate-100/80 text-slate-800 border-slate-200/70'
                  }`}
                  data-testid={`history-tag-${activeSection}-${idx}`}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="hover:text-rose-600 font-bold ml-0.5 transition-colors cursor-pointer"
                    onClick={() => onRemoveTag(activeSection, tag)}
                    title="Remove tag"
                  >
                    &times;
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
