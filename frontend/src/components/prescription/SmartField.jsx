import React, { useState, useEffect, useRef, useMemo } from 'react';
import { masterDataService } from '../../services/masterDataService';
import MasterDataModal from './MasterDataModal';

/**
 * Reusable SmartField Component
 * Features:
 * - Top Row: Label & Action Buttons (Colored Add button, sleek Manage button)
 * - Middle Row: Text input or textarea
 * - Bottom Row: 1-Row Ultra-Thin Suggestion Chips (Filtered dynamically via useMemo - zero render loops)
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef(null);

  const loadSuggestions = () => {
    const data = masterDataService.getCategory(category) || [];
    setSuggestions(data);
  };

  useEffect(() => {
    loadSuggestions();
  }, [category]);

  // Derive filtered suggestions directly and synchronously via useMemo
  // Use a stringified signature for excludeTags to guarantee zero infinite setState loops
  const excludeSignature = (excludeTags || [])
    .map((ex) => (typeof ex === 'string' ? ex : ex?.complaint || ex?.test_name || ''))
    .join('|')
    .toLowerCase();

  const filtered = useMemo(() => {
    const excludeSet = new Set(
      (excludeTags || []).map((ex) =>
        (typeof ex === 'string' ? ex : ex?.complaint || ex?.test_name || '').toLowerCase()
      )
    );

    const available = (suggestions || []).filter(
      (s) => !excludeSet.has(s.toLowerCase())
    );

    if (value && typeof value === 'string' && value.trim()) {
      const q = value.toLowerCase().trim();
      return available.filter((s) => s.toLowerCase().includes(q));
    }
    return available.slice(0, 12);
  }, [suggestions, excludeSignature, value]);

  const handleInputChange = (text) => {
    onChange(text);
  };

  const handleSelectSuggestion = (item) => {
    onSelectTag(item);
    onChange('');
  };

  const handleAddDirect = () => {
    if (value && typeof value === 'string' && value.trim()) {
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

      {/* 2. MIDDLE ROW: Input Field */}
      {isTextarea ? (
        <textarea
          rows="2"
          className="w-full px-3 py-1.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all resize-none"
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAddDirect();
            }
          }}
          data-testid={testId}
        />
      ) : (
        <input
          type="text"
          className="w-full h-8 px-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
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

      {/* 3. BOTTOM ROW: Ultra-Thin Suggestion Chips (Whisper-Light Green on hover) */}
      {filtered.length > 0 && (
        <div
          className="flex overflow-x-auto items-center gap-1.5 mt-1 pb-0.5 ultra-thin-scrollbar"
          data-testid={`suggestions-bar-${category}`}
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
              <span className="truncate max-w-[180px]">{item}</span>
            </button>
          ))}
        </div>
      )}

      {/* Master Data Management Dialog */}
      <MasterDataModal
        isOpen={isModalOpen}
        category={category}
        title={`${label} Presets`}
        onClose={() => setIsModalOpen(false)}
        onDataUpdated={loadSuggestions}
      />
    </div>
  );
}
