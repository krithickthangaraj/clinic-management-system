import React, { useState, useEffect, useRef } from 'react';
import { masterDataService } from '../../services/masterDataService';
import MasterDataModal from './MasterDataModal';

export default function SmartCombobox({
  category = 'complaints',
  label = 'Chief Complaints',
  placeholder = 'Type to search or add new...',
  value = '',
  onChange = () => {},
  onSelectTag = () => {},
  testId = 'smart-combobox-input',
  showAddButton = true,
  autoSaveToMaster = true,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef(null);

  const loadSuggestions = () => {
    setSuggestions(masterDataService.getCategory(category));
  };

  useEffect(() => {
    loadSuggestions();
  }, [category]);

  const handleInputChange = (text) => {
    onChange(text);
    if (text.trim()) {
      const q = text.toLowerCase().trim();
      const matches = suggestions.filter((s) => s.toLowerCase().includes(q));
      setFiltered(matches);
      setIsOpen(matches.length > 0);
    } else {
      setFiltered([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    onChange('');
    onSelectTag(item);
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    if (value.trim()) {
      const trimmed = value.trim();
      if (autoSaveToMaster) {
        masterDataService.addItem(category, trimmed);
        loadSuggestions();
      }
      onSelectTag(trimmed);
      onChange('');
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      {/* Label with Manage Master Data Pencil Icon */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
          {label}
        </label>

        <button
          type="button"
          className="text-slate-400 hover:text-teal-700 p-0.5 rounded transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
          onClick={() => setIsModalOpen(true)}
          title={`Manage Master ${label}`}
          data-testid={`btn-manage-master-${category}`}
        >
          <svg
            className="w-3.5 h-3.5"
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
          <span className="hidden sm:inline">Manage</span>
        </button>
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (value.trim()) handleInputChange(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          data-testid={testId}
        />

        {showAddButton && (
          <button
            type="button"
            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center"
            onClick={handleAddCustom}
            data-testid={`btn-add-${category}`}
          >
            + Add
          </button>
        )}
      </div>

      {/* Suggestions Combobox Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="px-3.5 py-2 hover:bg-teal-50 hover:text-teal-900 cursor-pointer text-xs transition-colors flex items-center justify-between"
              onClick={() => handleSelect(item)}
              title={item}
            >
              <span className="font-medium truncate">{item}</span>
              <span className="text-[10px] text-slate-400">Master</span>
            </div>
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
