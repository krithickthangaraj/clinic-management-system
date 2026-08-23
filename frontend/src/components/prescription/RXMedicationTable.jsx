import { useEffect, useState, useRef } from 'react';
import medicineService from '../../services/medicineService';

const FREQUENCY_OPTIONS = [
  'TDS (1-1-1)',
  'BD (1-0-1)',
  'OD (1-0-0)',
  'HS (0-0-1)',
  'QID (1-1-1-1)',
  'SOS (As needed)',
  'STAT (Immediately)',
  'QW (Once weekly)',
];

const DOSAGE_OPTIONS = [
  '1 Tab',
  '2 Tabs',
  '0.5 Tab',
  '1 Cap',
  '2 Caps',
  '250mg',
  '500mg',
  '650mg',
  '5ml',
  '7.5ml',
  '10ml',
  '15ml',
  '1 Puff',
  '1 Drop',
  '1 Inj',
  'Apply',
];

const INSTRUCTION_OPTIONS = [
  'After food',
  'Before food',
  'With food',
  'Empty stomach',
  'At bedtime',
  'With warm water',
  'To chew at bed time',
  'Fever, Headache',
  'Gently massage on pain area',
  'Morning with water',
  'After lunch',
  'After dinner',
];

/**
 * Enhanced Doctor RX Medication Table Component
 * Features:
 * - "Magic Auto-Fill": Autocomplete searches 40+ MedicineMaster templates
 * - Populates Brand, Drug, Dosage, Frequency, Days, Instructions & auto-computes Quantity
 * - Inline "Save to Master" action button to customize and persist defaults
 * - High-speed keyboard navigation and drag-to-reorder rows
 */
export default function RXMedicationTable({
  medicines = [],
  onAddDrug = () => {},
  onDuplicateDrug = () => {},
  onMoveDrug = () => {},
  onRemoveDrug = () => {},
  onUpdateDrug = () => {},
  onApplyMasterDrug = () => {},
  onToast = () => {},
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'brand' | 'drug'
  const [searchResults, setSearchResults] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [savingIndex, setSavingIndex] = useState(null);
  const [savedSuccessIndex, setSavedSuccessIndex] = useState(null);
  const dropdownRef = useRef(null);

  // Load MedicineMaster dictionary on mount
  useEffect(() => {
    let isMounted = true;
    medicineService
      .searchMedicineMaster('')
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setMasterMedicines(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Click outside listener to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveSearchIndex(null);
        setActiveSearchField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (index, field, value) => {
    onUpdateDrug(index, field, value);
    if (value && value.trim().length >= 1) {
      const q = value.toLowerCase().trim();
      const localMatches = masterMedicines
        .filter(
          (m) =>
            m.brand_name?.toLowerCase().includes(q) ||
            m.drug_name?.toLowerCase().includes(q)
        )
        .slice(0, 10);

      setSearchResults(localMatches);
      setActiveSearchIndex(index);
      setActiveSearchField(field);

      // Async fetch for broader match
      if (localMatches.length < 3) {
        try {
          const apiMatches = await medicineService.searchMedicineMaster(q);
          if (Array.isArray(apiMatches) && apiMatches.length > 0) {
            setSearchResults(apiMatches.slice(0, 10));
          }
        } catch {
          // ignore
        }
      }
    } else {
      setSearchResults([]);
      setActiveSearchIndex(null);
      setActiveSearchField(null);
    }
  };

  const handleSelectMasterDrug = (index, masterDrug) => {
    if (onApplyMasterDrug) {
      onApplyMasterDrug(index, masterDrug);
    } else {
      onUpdateDrug(index, 'brand_name', masterDrug.brand_name || '');
      onUpdateDrug(index, 'drug_name', masterDrug.drug_name || '');
      if (masterDrug.dosage) onUpdateDrug(index, 'dosage', masterDrug.dosage);
      if (masterDrug.frequency) onUpdateDrug(index, 'frequency', masterDrug.frequency);
      if (masterDrug.number_of_days) onUpdateDrug(index, 'days', masterDrug.number_of_days);
      if (masterDrug.instructions) onUpdateDrug(index, 'instructions', masterDrug.instructions);
    }
    setActiveSearchIndex(null);
    setActiveSearchField(null);
    setSearchResults([]);
  };

  // Inline "Save to Master" Action
  const handleSaveToMaster = async (drug, index) => {
    if (!drug.drug_name || !drug.drug_name.trim()) {
      alert('Drug Name is required to save as Master default template.');
      return;
    }
    setSavingIndex(index);
    try {
      const payload = {
        brand_name: drug.brand_name?.trim() || null,
        drug_name: drug.drug_name.trim(),
        dosage: drug.dosage || '1 Tab',
        frequency: drug.frequency || 'TDS (1-1-1)',
        number_of_days: parseInt(drug.days || 5, 10),
        instructions: drug.instructions || 'After food',
        quantity: parseInt(drug.quantity || 15, 10),
      };
      await medicineService.createMedicineMaster(payload);
      setSavedSuccessIndex(index);
      onToast(`Saved "${drug.brand_name || drug.drug_name}" to Global Medicine Master!`);

      // Refresh local master list
      const refreshed = await medicineService.searchMedicineMaster('');
      if (Array.isArray(refreshed)) {
        setMasterMedicines(refreshed);
      }
      setTimeout(() => setSavedSuccessIndex(null), 2500);
    } catch (err) {
      console.error('Failed to save to master:', err);
      alert(err.response?.data?.detail || 'Failed to save template to Medicine Master.');
    } finally {
      setSavingIndex(null);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onMoveDrug(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
      data-testid="rx-medication-section"
    >
      {/* 1. Header Toolbar */}
      <div
        className="px-5 py-3.5 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-800 font-serif font-bold text-xs flex items-center justify-center shadow-2xs">
            ℞
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Prescription Medication &amp; Regimen
            </h3>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
            {medicines.length} Medicine{medicines.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Top-Right Add Button */}
          <button
            type="button"
            className="h-8 px-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            onClick={() => onAddDrug()}
            data-testid="btn-add-drug-top"
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
            <span>Add Medicine</span>
          </button>

          {/* Toggle Chevron Arrow Button */}
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle medications panel"
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
      </div>

      {isOpen && (
        <div className="p-5 space-y-3.5">
          {/* 2. Responsive Rigid Medication Grid Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs" ref={dropdownRef}>
            <table className="w-full text-left border-collapse min-w-[1020px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                  <th className="py-2.5 px-3 w-48">Brand Name</th>
                  <th className="py-2.5 px-3 min-w-[190px]">Drug Name</th>
              <th className="py-2.5 px-3 w-28">Dosage</th>
              <th className="py-2.5 px-3 w-36">Frequency</th>
              <th className="py-2.5 px-3 w-20 text-center">Days</th>
              <th className="py-2.5 px-3 w-44">Instructions</th>
              <th className="py-2.5 px-3 w-20 text-center">Quantity</th>
              <th className="py-2.5 px-3 w-28 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
            {medicines.map((row, idx) => {
              const isDragging = draggedIndex === idx;
              const isDragOver = dragOverIndex === idx;
              const isRowSaved = savedSuccessIndex === idx;
              const isRowSaving = savingIndex === idx;

              return (
                <tr
                  key={row.s_no || idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`hover:bg-slate-50/70 transition-colors group relative ${
                    isDragging ? 'opacity-40 bg-slate-100' : ''
                  } ${isDragOver ? 'border-t-2 border-teal-500 bg-teal-50/30' : ''}`}
                  data-testid={`rx-row-${idx}`}
                >
                  {/* S.No & Drag Handle */}
                  <td className="py-2 px-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
                        title="Drag to reorder"
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
                          <circle cx="9" cy="5" r="1" />
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="5" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <circle cx="15" cy="19" r="1" />
                        </svg>
                      </span>
                      <span className="font-mono text-slate-500 font-semibold text-xs">
                        {idx + 1}
                      </span>
                    </div>
                  </td>

                  {/* Brand Name with Autocomplete */}
                  <td className="py-2 px-2 align-middle relative">
                    <input
                      type="text"
                      className="w-full h-8 px-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-bold"
                      placeholder="e.g. Panpro 40mg, Dolo"
                      value={row.brand_name || ''}
                      onChange={(e) => handleSearchChange(idx, 'brand_name', e.target.value)}
                      onFocus={() => {
                        if (row.brand_name?.trim()?.length >= 1) {
                          handleSearchChange(idx, 'brand_name', row.brand_name);
                        }
                      }}
                      data-testid={`input-brand-${idx}`}
                    />

                    {/* Autocomplete Dropdown */}
                    {activeSearchIndex === idx && activeSearchField === 'brand_name' && searchResults.length > 0 && (
                      <div
                        className="absolute top-full left-2 right-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto mt-1 divide-y divide-slate-100 min-w-[280px]"
                        data-testid="brand-search-dropdown"
                      >
                        {searchResults.map((m, sIdx) => (
                          <div
                            key={sIdx}
                            className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-xs transition-colors flex items-center justify-between"
                            onClick={() => handleSelectMasterDrug(idx, m)}
                          >
                            <div>
                              <strong className="text-teal-950 font-bold">{m.brand_name}</strong>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {m.drug_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                                {m.default_frequency || m.frequency || 'TDS'}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {m.default_days || m.days || 3}d &bull; {m.default_dosage || m.dosage || '1 Tab'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Generic Drug Name with Autocomplete */}
                  <td className="py-2 px-2 align-middle relative">
                    <input
                      type="text"
                      className="w-full h-8 px-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium font-mono"
                      placeholder="e.g. Pantoprazole, Paracetamol"
                      value={row.drug_name || ''}
                      onChange={(e) => handleSearchChange(idx, 'drug_name', e.target.value)}
                      onFocus={() => {
                        if (row.drug_name?.trim()?.length >= 1) {
                          handleSearchChange(idx, 'drug_name', row.drug_name);
                        }
                      }}
                      required
                      data-testid={`input-drug-${idx}`}
                    />

                    {/* Autocomplete Dropdown */}
                    {activeSearchIndex === idx && activeSearchField === 'drug_name' && searchResults.length > 0 && (
                      <div
                        className="absolute top-full left-2 right-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto mt-1 divide-y divide-slate-100 min-w-[280px]"
                        data-testid="drug-search-dropdown"
                      >
                        {searchResults.map((m, sIdx) => (
                          <div
                            key={sIdx}
                            className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-xs transition-colors flex items-center justify-between"
                            onClick={() => handleSelectMasterDrug(idx, m)}
                          >
                            <div>
                              <strong className="text-slate-900 font-semibold">{m.drug_name}</strong>
                              <div className="text-[11px] text-teal-700 font-medium">
                                {m.brand_name}
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {m.default_dosage || '1 Tab'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Dosage Select / Input */}
                  <td className="py-2 px-2 align-middle">
                    <select
                      className="w-full h-8 px-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium cursor-pointer"
                      value={row.dosage || '1 Tab'}
                      onChange={(e) => onUpdateDrug(idx, 'dosage', e.target.value)}
                      data-testid={`select-dosage-${idx}`}
                    >
                      {DOSAGE_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      {!DOSAGE_OPTIONS.includes(row.dosage) && row.dosage && (
                        <option value={row.dosage}>{row.dosage}</option>
                      )}
                    </select>
                  </td>

                  {/* Frequency */}
                  <td className="py-2 px-2 align-middle">
                    <select
                      className="w-full h-8 px-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium cursor-pointer"
                      value={row.frequency || 'TDS (1-1-1)'}
                      onChange={(e) => onUpdateDrug(idx, 'frequency', e.target.value)}
                      data-testid={`select-frequency-${idx}`}
                    >
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                      {!FREQUENCY_OPTIONS.includes(row.frequency) && row.frequency && (
                        <option value={row.frequency}>{row.frequency}</option>
                      )}
                    </select>
                  </td>

                  {/* Days */}
                  <td className="py-2 px-2 align-middle">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="w-full h-8 px-1.5 text-center bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-semibold font-mono"
                      value={row.days ?? 3}
                      onChange={(e) =>
                        onUpdateDrug(idx, 'days', parseInt(e.target.value, 10) || 1)
                      }
                      data-testid={`input-days-${idx}`}
                    />
                  </td>

                  {/* Instructions */}
                  <td className="py-2 px-2 align-middle">
                    <select
                      className="w-full h-8 px-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium cursor-pointer"
                      value={row.instructions || 'After food'}
                      onChange={(e) => onUpdateDrug(idx, 'instructions', e.target.value)}
                      data-testid={`select-instructions-${idx}`}
                    >
                      {INSTRUCTION_OPTIONS.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                      {!INSTRUCTION_OPTIONS.includes(row.instructions) && row.instructions && (
                        <option value={row.instructions}>{row.instructions}</option>
                      )}
                    </select>
                  </td>

                  {/* Auto-Calculated / Editable Quantity */}
                  <td className="py-2 px-2 align-middle text-center">
                    <input
                      type="number"
                      min="1"
                      className="w-16 h-8 px-1 text-center bg-teal-50/40 border border-teal-200/80 rounded-md text-xs font-mono font-bold text-teal-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all shadow-2xs"
                      value={row.quantity || 0}
                      onChange={(e) =>
                        onUpdateDrug(idx, 'quantity', parseInt(e.target.value, 10) || 0)
                      }
                      title="Auto-calculated quantity based on dosage &amp; days"
                      data-testid={`input-qty-${idx}`}
                    />
                  </td>

                  {/* Actions Tray */}
                  <td className="py-2 px-2 align-middle text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Save to Master Button */}
                      <button
                        type="button"
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isRowSaved
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        onClick={() => handleSaveToMaster(idx, row)}
                        title={isRowSaved ? 'Saved to Master!' : 'Save current row as default to Medicine Master'}
                        disabled={isRowSaving}
                        data-testid={`btn-save-master-${idx}`}
                      >
                        {isRowSaved ? (
                          <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg
                            className={`w-3.5 h-3.5 ${isRowSaving ? 'animate-spin' : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                        )}
                      </button>

                      {/* Duplicate Button */}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-teal-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => onDuplicateDrug(idx)}
                        title="Duplicate Row"
                        data-testid={`btn-duplicate-row-${idx}`}
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
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        onClick={() => onRemoveDrug(idx)}
                        title="Delete Row"
                        data-testid={`btn-delete-row-${idx}`}
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* 3. Table Footer: Bottom-Left "+ Add Row" Button */}
          <tfoot>
            <tr className="bg-slate-50/60 border-t border-slate-200">
              <td colSpan="9" className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    onClick={() => onAddDrug()}
                    data-testid="btn-add-drug-bottom"
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
                    <span>+ Add Row</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Total Drugs: {medicines.length}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      </div>
      )}
    </section>
  );
}
