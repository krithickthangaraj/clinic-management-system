import React, { useState, useEffect, useRef } from 'react';
import { masterDataService } from '../../services/masterDataService';
import MasterDataModal from './MasterDataModal';

/**
 * Reusable SmartField Component
 * Features:
 * - Top Row: Label & Action Buttons (Colored Add button, sleek Manage button)
 * - Middle Row: Text input or textarea
 * - Bottom Row: 1-Row Ultra-Thin Suggestion Chips (Filtered dynamically)
 */
export default function SmartField({
  category = 'complaints',
  label = 'Chief Complaints',
  placeholder = '',
  value = '',
  onChange = () => {},
  onSelectTag = () => {},
  excludeTags = [],
  testId = 'smart-field-input',
  isTextarea = false,
  autoSaveToMaster = true,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef(null);

  const loadSuggestions = () => {
    const data = masterDataService.getCategory(category) || [];
    setSuggestions(data);
  };

  useEffect(() => {
    loadSuggestions();
  }, [category]);

  // Dynamically filter out already-recorded/excluded tags and search query
  useEffect(() => {
    const available = suggestions.filter(
      (s) => !excludeTags.some((ex) => (typeof ex === 'string' ? ex : ex.complaint || '').toLowerCase() === s.toLowerCase())
    );

    if (value.trim()) {
      const q = value.toLowerCase().trim();
      setFiltered(available.filter((s) => s.toLowerCase().includes(q)));
    } else {
      setFiltered(available.slice(0, 12));
    }
  }, [suggestions, excludeTags, value]);

  const handleInputChange = (text) => {
    onChange(text);
  };

  const handleSelectSuggestion = (item) => {
    onSelectTag(item);
    onChange('');
  };

  const handleAddDirect = () => {
    if (value.trim()) {
      const trimmed = value.trim();
      if (autoSaveToMaster) {
        masterDataService.addItem(category, trimmed);
        loadSuggestions();
      }
      onSelectTag(trimmed);
      onChange('');
    }
  };

  return (
    <div className="flex flex-col relative" ref={containerRef}>
      {/* 1. TOP ROW: Label & Action Buttons */}
      <div className="flex justify-between items-end mb-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block truncate">
          {label}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Elegant Colored Add Button */}
          <button
            type="button"
            className="h-6 px-2.5 text-[11px] font-semibold text-white bg-teal-700 hover:bg-teal-800 active:scale-95 rounded-md flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            onClick={handleAddDirect}
            title={`Add to ${label}`}
            data-testid={`btn-quick-add-${category}`}
          >
            <svg
              className="w-3 h-3 text-white"
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

          {/* Sleek Manage Button */}
          <button
            type="button"
            className="h-6 px-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            onClick={() => setIsModalOpen(true)}
            title={`Manage ${label} dictionary`}
            data-testid={`btn-manage-master-${category}`}
          >
            <svg
              className="w-3 h-3 text-slate-500"
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
            <span>Manage</span>
          </button>
        </div>
      </div>

      {/* 2. MIDDLE ROW: The Input / Textarea */}
      {isTextarea ? (
        <textarea
          className="w-full min-h-[80px] h-20 px-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all resize-y"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          data-testid={testId}
        />
      ) : (
        <input
          type="text"
          className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddDirect();
            }
          }}
          data-testid={testId}
        />
      )}

      {/* 3. BOTTOM ROW: Ultra-Thin, Elegant Suggestions Bar */}
      {filtered.length > 0 && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto mt-1 pb-1 ultra-thin-scrollbar"
          data-testid={`suggestions-row-${category}`}
        >
          {filtered.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10.5px] font-medium bg-slate-50 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-900 border border-slate-200/70 hover:border-emerald-200/50 shadow-2xs transition-all shrink-0 cursor-pointer group"
              onClick={() => handleSelectSuggestion(item)}
              title={item}
              data-testid={`chip-${category}-${idx}`}
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
              <span className="truncate max-w-[160px]">{item}</span>
            </button>
          ))}
        </div>
      )}

      {/* Master Data Management Dialog */}
      <MasterDataModal
        isOpen={isModalOpen}
        category={category}
        title={label}
        onClose={() => setIsModalOpen(false)}
        onDataUpdated={loadSuggestions}
      />
    </div>
  );
}
