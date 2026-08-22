import { useEffect, useState } from 'react';
import api from '../../services/api';

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
  '1 Cap',
  '250mg',
  '500mg',
  '650mg',
  '5ml',
  '10ml',
  '1 Puff',
  '1 Drop',
];

const INSTRUCTION_OPTIONS = [
  'After food',
  'Before food',
  'With food',
  'Empty stomach',
  'At bedtime',
  'With warm water',
];

/**
 * Pure RX Medication Table Component
 * Features:
 * - 100% focused on prescription medicines and dosing regimens
 * - All template engine features decoupled to the dedicated TemplateEngineSection
 * - High-speed keyboard navigation and drag-to-reorder rows
 * - Compact, production-grade styling
 */
export default function RXMedicationTable({
  medicines = [],
  onAddDrug = () => {},
  onDuplicateDrug = () => {},
  onMoveDrug = () => {},
  onRemoveDrug = () => {},
  onUpdateDrug = () => {},
}) {
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/master/meds/drugs')
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          setMasterMedicines(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDrugNameChange = (index, value) => {
    onUpdateDrug(index, 'drug_name', value);
    if (value.trim().length >= 2) {
      const q = value.toLowerCase().trim();
      const matches = masterMedicines
        .filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.brand_name?.toLowerCase().includes(q) ||
            m.generic_name?.toLowerCase().includes(q)
        )
        .slice(0, 8);
      setSearchResults(matches);
      setActiveSearchIndex(index);
    } else {
      setSearchResults([]);
      setActiveSearchIndex(null);
    }
  };

  const handleSelectMasterDrug = (index, masterDrug) => {
    onUpdateDrug(index, 'drug_name', masterDrug.name || masterDrug.generic_name || '');
    if (masterDrug.brand_name) {
      onUpdateDrug(index, 'brand_name', masterDrug.brand_name);
    }
    if (masterDrug.dosage) {
      onUpdateDrug(index, 'dosage', masterDrug.dosage);
    }
    if (masterDrug.frequency) {
      onUpdateDrug(index, 'frequency', masterDrug.frequency);
    }
    if (masterDrug.instructions) {
      onUpdateDrug(index, 'instructions', masterDrug.instructions);
    }
    setSearchResults([]);
    setActiveSearchIndex(null);
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
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
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-3.5 mb-6"
      data-testid="rx-medication-section"
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-800 font-serif font-bold text-sm flex items-center justify-center shadow-2xs">
            ℞
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Prescription Medication &amp; Regimen
            </h3>
          </div>
        </div>

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
      </div>

      {/* 2. Responsive Rigid Medication Grid Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 w-36">Brand</th>
              <th className="py-2.5 px-3 min-w-[200px]">Drug Name *</th>
              <th className="py-2.5 px-3 w-28">Dosage</th>
              <th className="py-2.5 px-3 w-36">Frequency</th>
              <th className="py-2.5 px-3 w-20 text-center">Days</th>
              <th className="py-2.5 px-3 w-40">Instructions</th>
              <th className="py-2.5 px-3 w-20 text-center">Qty</th>
              <th className="py-2.5 px-3 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
            {medicines.map((row, idx) => {
              const isDragging = draggedIndex === idx;
              const isDragOver = dragOverIndex === idx;

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

                  {/* Brand Name */}
                  <td className="py-2 px-2 align-middle">
                    <input
                      type="text"
                      className="w-full h-8 px-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                      placeholder="Brand"
                      value={row.brand_name || ''}
                      onChange={(e) => onUpdateDrug(idx, 'brand_name', e.target.value)}
                      data-testid={`input-brand-${idx}`}
                    />
                  </td>

                  {/* Drug Name with Autocomplete */}
                  <td className="py-2 px-2 align-middle relative">
                    <input
                      type="text"
                      className="w-full h-8 px-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-md text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-semibold"
                      placeholder="Drug name"
                      value={row.drug_name || ''}
                      onChange={(e) => handleDrugNameChange(idx, e.target.value)}
                      onFocus={() => {
                        if (row.drug_name?.trim()?.length >= 2) {
                          handleDrugNameChange(idx, row.drug_name);
                        }
                      }}
                      required
                      data-testid={`input-drug-${idx}`}
                    />

                    {/* Master Medicines Search Results Dropdown */}
                    {activeSearchIndex === idx && searchResults.length > 0 && (
                      <div
                        className="absolute top-full left-2 right-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100"
                        data-testid="master-search-dropdown"
                      >
                        {searchResults.map((m, sIdx) => (
                          <div
                            key={sIdx}
                            className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-xs transition-colors flex items-center justify-between"
                            onClick={() => handleSelectMasterDrug(idx, m)}
                          >
                            <div>
                              <strong className="text-slate-900 font-semibold">{m.name}</strong>
                              {m.brand_name && (
                                <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                                  ({m.brand_name})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {m.dosage || 'Tab'}
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
                      value={row.days ?? 5}
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
                      title="Auto-calculated quantity"
                      data-testid={`input-qty-${idx}`}
                    />
                  </td>

                  {/* Actions Tray */}
                  <td className="py-2 px-2 align-middle text-center">
                    <div className="flex items-center justify-center gap-1">
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
    </section>
  );
}
