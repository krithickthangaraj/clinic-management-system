import { useEffect, useState } from 'react';
import { CLINICAL_TEMPLATES } from '../../hooks/usePrescriptionForm';
import api from '../../services/api';
import SaveTemplateModal from './SaveTemplateModal';

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

export default function RXMedicationTable({
  medicines = [],
  onAddDrug = () => {},
  onDuplicateDrug = () => {},
  onMoveDrug = () => {},
  onRemoveDrug = () => {},
  onUpdateDrug = () => {},
  onLoadTemplate = () => {},
}) {
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState({});
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

    // Load custom saved templates
    try {
      const stored = localStorage.getItem('clinic_custom_templates_v1');
      if (stored) {
        setCustomTemplates(JSON.parse(stored));
      }
    } catch {}

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

  const handleSaveNewTemplate = (name, drugs) => {
    const key = `custom_${Date.now()}`;
    const validDrugs = drugs.filter((d) => d.drug_name && d.drug_name.trim());
    const newT = {
      name,
      medicines: validDrugs,
    };
    const updated = { ...customTemplates, [key]: newT };
    setCustomTemplates(updated);
    try {
      localStorage.setItem('clinic_custom_templates_v1', JSON.stringify(updated));
    } catch {}
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

  const allTemplates = { ...CLINICAL_TEMPLATES, ...customTemplates };

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4 mb-6"
      data-testid="rx-medication-section"
    >
      {/* 1. Header Toolbar with Top-Right Template Engine */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-800 font-serif font-bold text-base flex items-center justify-center shadow-2xs">
            ℞
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              Prescription Medication &amp; Regimen
            </h3>
            <span className="text-[11px] font-medium text-slate-400" data-testid="drugs-count-label">
              {medicines.length} medications listed &bull; Drag handle to reorder
            </span>
          </div>
        </div>

        {/* Top-Right Action Controls: Templates, Save Template, Add Drug */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Template Selector */}
          <div className="flex items-center gap-1.5">
            <select
              id="template-select"
              className="h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer transition-all"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  const val = e.target.value;
                  if (customTemplates[val]) {
                    // Load custom template
                    const t = customTemplates[val];
                    if (t.medicines) {
                      t.medicines.forEach((m, idx) => {
                        if (idx === 0) {
                          onUpdateDrug(0, 'drug_name', m.drug_name);
                          onUpdateDrug(0, 'brand_name', m.brand_name);
                          onUpdateDrug(0, 'dosage', m.dosage);
                          onUpdateDrug(0, 'frequency', m.frequency);
                          onUpdateDrug(0, 'days', m.days);
                          onUpdateDrug(0, 'instructions', m.instructions);
                        } else {
                          onAddDrug(m);
                        }
                      });
                    }
                  } else {
                    onLoadTemplate(val);
                  }
                  e.target.value = '';
                }
              }}
              data-testid="select-prescription-template"
            >
              <option value="" disabled>
                1-Click Protocol Template...
              </option>
              {Object.entries(allTemplates).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save as Template Button */}
          <button
            type="button"
            className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            onClick={() => setIsSaveTemplateModalOpen(true)}
            title="Save current medications as a named template"
            data-testid="btn-save-as-template"
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
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>Save as Template</span>
          </button>

          {/* Add Medicine Button */}
          <button
            type="button"
            className="h-10 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            onClick={() => onAddDrug()}
            data-testid="btn-add-drug"
            title="Add Drug (Alt + N)"
          >
            <svg
              className="w-4 h-4"
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
      </div>

      {/* 2. Full-Width Linear Table with Drag Handle & Reordering */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/60">
        <table
          className="w-full border-collapse"
          data-testid="rx-medication-table"
        >
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="w-14 py-3 px-2 text-center">Grip / #</th>
              <th className="w-40 py-3 px-2 text-left">Brand</th>
              <th className="min-w-[220px] py-3 px-2 text-left">Drug / Generic Name *</th>
              <th className="w-28 py-3 px-2 text-left">Dosage</th>
              <th className="w-36 py-3 px-2 text-left">Frequency</th>
              <th className="w-18 py-3 px-2 text-center">Days</th>
              <th className="w-36 py-3 px-2 text-left">Instructions</th>
              <th className="w-20 py-3 px-2 text-center">Qty</th>
              <th className="w-24 py-3 px-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {medicines.map((row, idx) => (
              <tr
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`transition-colors group ${
                  dragOverIndex === idx
                    ? 'bg-teal-50/80 border-t-2 border-teal-500'
                    : 'hover:bg-slate-50/60'
                }`}
                data-testid={`rx-row-${idx}`}
              >
                {/* 1. 6-Dot Drag Handle & S.No */}
                <td className="py-2.5 px-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* 6-Dot Drag Grip Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5"
                      title="Drag to reorder"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="8" cy="5" r="2" />
                        <circle cx="16" cy="5" r="2" />
                        <circle cx="8" cy="12" r="2" />
                        <circle cx="16" cy="12" r="2" />
                        <circle cx="8" cy="19" r="2" />
                        <circle cx="16" cy="19" r="2" />
                      </svg>
                    </div>

                    <span className="font-mono font-bold text-xs text-slate-400">
                      {row.s_no || idx + 1}
                    </span>

                    {/* Up / Down Accessibility Reorder Controls */}
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="text-[9px] text-slate-400 hover:text-teal-700 leading-none disabled:opacity-10 cursor-pointer p-0.5"
                        disabled={idx === 0}
                        onClick={() => onMoveDrug(idx, idx - 1)}
                        title="Move Up"
                        data-testid={`btn-move-up-${idx}`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="text-[9px] text-slate-400 hover:text-teal-700 leading-none disabled:opacity-10 cursor-pointer p-0.5"
                        disabled={idx === medicines.length - 1}
                        onClick={() => onMoveDrug(idx, idx + 1)}
                        title="Move Down"
                        data-testid={`btn-move-down-${idx}`}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>

                {/* 2. Brand Name */}
                <td className="py-2.5 px-2 text-left">
                  <input
                    type="text"
                    className="w-full h-9 px-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-md text-xs text-slate-900 placeholder-slate-400 shadow-2xs font-medium transition-all"
                    placeholder="e.g. Dolo 650"
                    value={row.brand_name || ''}
                    onChange={(e) => onUpdateDrug(idx, 'brand_name', e.target.value)}
                    data-testid={`input-brand-${idx}`}
                  />
                </td>

                {/* 3. Drug / Generic Name with Autocomplete */}
                <td className="py-2.5 px-2 text-left relative">
                  <input
                    type="text"
                    className="w-full h-9 px-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-md text-xs text-slate-900 placeholder-slate-400 shadow-2xs font-semibold transition-all"
                    placeholder="e.g. Paracetamol 650mg"
                    value={row.drug_name || ''}
                    onChange={(e) => handleDrugNameChange(idx, e.target.value)}
                    onFocus={() => {
                      if (row.drug_name && row.drug_name.length >= 2) {
                        handleDrugNameChange(idx, row.drug_name);
                      }
                    }}
                    data-testid={`input-drug-${idx}`}
                    required
                  />

                  {/* Auto-suggest dropdown */}
                  {activeSearchIndex === idx && searchResults.length > 0 && (
                    <div
                      className="absolute top-full left-2 right-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100"
                      data-testid={`autocomplete-dropdown-${idx}`}
                    >
                      {searchResults.map((m) => (
                        <div
                          key={m.id}
                          className="px-3 py-2 hover:bg-teal-50 cursor-pointer flex items-center gap-2 text-xs transition-colors"
                          onClick={() => handleSelectMasterDrug(idx, m)}
                          data-testid={`autocomplete-item-${m.id}`}
                        >
                          <strong className="font-bold text-slate-900">{m.name}</strong>
                          {m.brand_name && (
                            <span className="text-slate-500">({m.brand_name})</span>
                          )}
                          {m.generic_name && (
                            <span className="text-teal-700 font-medium">
                              &bull; {m.generic_name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* 4. Dosage */}
                <td className="py-2.5 px-2 text-left">
                  <input
                    type="text"
                    className="w-full h-9 px-2 text-center bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-md text-xs text-slate-900 placeholder-slate-400 shadow-2xs transition-all"
                    placeholder="1 Tab"
                    list={`dosage-list-${idx}`}
                    value={row.dosage || ''}
                    onChange={(e) => onUpdateDrug(idx, 'dosage', e.target.value)}
                    data-testid={`input-dosage-${idx}`}
                  />
                  <datalist id={`dosage-list-${idx}`}>
                    {DOSAGE_OPTIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </td>

                {/* 5. Frequency */}
                <td className="py-2.5 px-2 text-left">
                  <select
                    className="w-full h-9 px-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-md text-xs text-slate-900 shadow-2xs cursor-pointer font-medium transition-all"
                    value={row.frequency || 'TDS (1-1-1)'}
                    onChange={(e) => onUpdateDrug(idx, 'frequency', e.target.value)}
                    data-testid={`select-freq-${idx}`}
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 6. Number of Days */}
                <td className="py-2.5 px-2 text-center">
                  <input
                    type="number"
                    min="1"
                    className="w-full h-9 px-1 text-center bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-md text-xs font-mono font-bold text-slate-900 shadow-2xs transition-all"
                    value={row.days !== undefined ? row.days : 5}
                    onChange={(e) =>
                      onUpdateDrug(idx, 'days', parseInt(e.target.value, 10) || 1)
                    }
                    data-testid={`input-days-${idx}`}
                  />
                </td>

                {/* 7. Instructions */}
                <td className="py-2.5 px-2 text-left">
                  <input
                    type="text"
                    className="w-full h-9 px-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-md text-xs text-slate-900 placeholder-slate-400 shadow-2xs transition-all"
                    placeholder="After food"
                    list={`inst-list-${idx}`}
                    value={row.instructions || ''}
                    onChange={(e) => onUpdateDrug(idx, 'instructions', e.target.value)}
                    data-testid={`input-inst-${idx}`}
                  />
                  <datalist id={`inst-list-${idx}`}>
                    {INSTRUCTION_OPTIONS.map((i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </td>

                {/* 8. Quantity (Auto-Calculated) */}
                <td className="py-2.5 px-2 text-center">
                  <input
                    type="number"
                    min="1"
                    className="w-full h-9 px-1 text-center bg-teal-50/80 border border-teal-200 rounded-md text-xs font-mono font-bold text-teal-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all"
                    title="Auto-calculated quantity"
                    value={row.quantity !== undefined ? row.quantity : 15}
                    onChange={(e) =>
                      onUpdateDrug(
                        idx,
                        'quantity',
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                    data-testid={`input-quantity-${idx}`}
                  />
                </td>

                {/* 9. Actions: Duplicate & Delete */}
                <td className="py-2.5 px-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                      onClick={() => onDuplicateDrug(idx)}
                      title="Duplicate Row"
                      data-testid={`btn-duplicate-${idx}`}
                    >
                      <svg
                        className="w-4 h-4"
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

                    <button
                      type="button"
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      onClick={() => onRemoveDrug(idx)}
                      title="Delete medication row"
                      data-testid={`btn-remove-${idx}`}
                    >
                      <svg
                        className="w-4 h-4"
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Current as Template Modal Dialog */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        medicines={medicines}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        onSaveTemplate={handleSaveNewTemplate}
      />
    </section>
  );
}
