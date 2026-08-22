import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import MasterDataModal from './MasterDataModal';

const HISTORY_SECTIONS = [
  { id: 'allergy_history', label: 'Allergies' },
  { id: 'past_history', label: 'Past' },
  { id: 'surgical_history', label: 'Surgical' },
  { id: 'family_history', label: 'Family' },
];

/**
 * Dedicated MedicalHistorySidebar Component
 * Features:
 * - Production-grade compact layout with tight spacing between input, suggestions & selected tags
 * - Whisper-light green tint across all 4 history categories
 * - Colored elegant Add button and sleek Manage button
 * - Single-line horizontally scrollable recorded items cloud
 * - Selected values automatically filtered out of available suggestions
 * - Top header badges for all 4 categories with count
 */
export default function MedicalHistorySidebar({
  history = {
    allergy_history: [],
    past_history: [],
    surgical_history: [],
    family_history: [],
  },
  onAddTag = () => {},
  onRemoveTag = () => {},
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('allergy_history');
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Load category dictionary items
  const loadCategorySuggestions = () => {
    const list = masterDataService.getCategory(activeSection) || [];
    setSuggestions(list);
  };

  useEffect(() => {
    loadCategorySuggestions();
    setTagInput('');
  }, [activeSection]);

  // Dynamically filter out already-recorded values from available suggestions
  useEffect(() => {
    const currentRecorded = history[activeSection] || [];
    const available = suggestions.filter(
      (s) => !currentRecorded.some((rec) => rec.toLowerCase() === s.toLowerCase())
    );

    if (tagInput.trim()) {
      const q = tagInput.toLowerCase().trim();
      setFilteredSuggestions(available.filter((s) => s.toLowerCase().includes(q)));
    } else {
      setFilteredSuggestions(available.slice(0, 12));
    }
  }, [history, activeSection, suggestions, tagInput]);

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    const trimmed = tagInput.trim();
    if (trimmed) {
      onAddTag(activeSection, trimmed);
      // Auto-save to master dictionary
      masterDataService.addItem(activeSection, trimmed);
      loadCategorySuggestions();
      setTagInput('');
    }
  };

  const handleSelectSuggestion = (item) => {
    onAddTag(activeSection, item);
  };

  const activeSectionObj =
    HISTORY_SECTIONS.find((s) => s.id === activeSection) || HISTORY_SECTIONS[0];

  const totalHistoryCount =
    (history.allergy_history?.length || 0) +
    (history.past_history?.length || 0) +
    (history.surgical_history?.length || 0) +
    (history.family_history?.length || 0);

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden mb-6"
      data-testid="medical-history-card"
    >
      {/* 1. Header Bar with Top Category Alert Badges (Whisper-Light Green) */}
      <div
        className="px-5 py-3 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        data-testid="btn-toggle-history"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <svg
            className="w-4 h-4 text-emerald-600/80 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
            Patient Medical History
          </span>

          {/* All 4 Category Header Badges in Whisper-Light Green Tint */}
          {history.allergy_history?.length > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/30 text-emerald-900 border border-emerald-200/40 shadow-2xs"
              data-testid="header-badge-allergies"
            >
              {history.allergy_history.length} Allergies
            </span>
          )}

          {history.past_history?.length > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/30 text-emerald-900 border border-emerald-200/40 shadow-2xs"
              data-testid="header-badge-past"
            >
              {history.past_history.length} Past
            </span>
          )}

          {history.surgical_history?.length > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/30 text-emerald-900 border border-emerald-200/40 shadow-2xs"
              data-testid="header-badge-surgical"
            >
              {history.surgical_history.length} Surgical
            </span>
          )}

          {history.family_history?.length > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/30 text-emerald-900 border border-emerald-200/40 shadow-2xs"
              data-testid="header-badge-family"
            >
              {history.family_history.length} Family
            </span>
          )}

          {totalHistoryCount === 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/60">
              0 Records
            </span>
          )}
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Toggle history panel"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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

      {/* 2. Body - Compact Spacing */}
      {isOpen && (
        <div className="p-5 space-y-2.5 bg-white" data-testid="history-body">
          {/* Category Tabs in Whisper-Light Green + Category-Specific Manage Button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {HISTORY_SECTIONS.map((sec) => {
                const count = history[sec.id]?.length || 0;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50/40 text-emerald-950 font-bold border border-emerald-200/50 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveSection(sec.id)}
                    data-testid={`tab-${sec.id}`}
                  >
                    {sec.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sleek Manage Button */}
            <button
              type="button"
              className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              onClick={() => setIsMasterModalOpen(true)}
              title={`Manage ${activeSectionObj.label} History Presets`}
              data-testid="btn-manage-history-master"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Manage {activeSectionObj.label}</span>
            </button>
          </div>

          {/* Quick Tag Add Input Row with Elegant Teal Add Button */}
          <form className="flex items-center gap-2" onSubmit={handleAdd}>
            <input
              type="text"
              className="flex-1 h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
              placeholder={`Enter ${activeSectionObj.label.toLowerCase()} history`}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              data-testid="input-history-tag"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
              data-testid="btn-add-history-tag"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add</span>
            </button>
          </form>

          {/* Available Suggestions Bar (Removes items once recorded) - Compact mt-1 */}
          {filteredSuggestions.length > 0 && (
            <div
              className="flex overflow-x-auto items-center gap-1.5 pb-0.5 ultra-thin-scrollbar"
              data-testid={`history-suggestions-${activeSection}`}
            >
              {filteredSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10.5px] font-medium bg-slate-50 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-900 border border-slate-200/70 hover:border-emerald-200/50 shadow-2xs transition-all shrink-0 cursor-pointer group"
                  onClick={() => handleSelectSuggestion(item)}
                  title={item}
                  data-testid={`chip-history-${activeSection}-${idx}`}
                >
                  <svg
                    className="w-2 h-2 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="truncate max-w-[180px]">{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Active Tags Cloud in Whisper-Light Green (Single Line Horizontal Scroll) - Compact mt-1 */}
          <div
            className="flex overflow-x-auto items-center gap-1.5 pb-0.5 ultra-thin-scrollbar h-7.5 max-h-7.5 min-h-[30px]"
            data-testid="history-tags-cloud"
          >
            {(history[activeSection] || []).length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No recorded items in {activeSectionObj.label}.
              </span>
            ) : (
              (history[activeSection] || []).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold bg-emerald-50/30 text-emerald-950 border border-emerald-200/40 shadow-2xs shrink-0 whitespace-nowrap"
                  data-testid={`history-tag-${activeSection}-${idx}`}
                >
                  <span className="truncate max-w-[200px]">{tag}</span>
                  <button
                    type="button"
                    className="hover:text-rose-600 font-bold ml-0.5 transition-colors cursor-pointer"
                    onClick={() => onRemoveTag(activeSection, tag)}
                    title="Remove"
                  >
                    &times;
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category-Specific Master Data Management Dialog */}
      <MasterDataModal
        isOpen={isMasterModalOpen}
        category={activeSection}
        title={`${activeSectionObj.label} History Presets`}
        onClose={() => setIsMasterModalOpen(false)}
        onDataUpdated={loadCategorySuggestions}
      />
    </section>
  );
}
