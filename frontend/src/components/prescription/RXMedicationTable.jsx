import React, { useState, useEffect } from 'react';
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

export default function RXMedicationTable({
  medicines = [],
  onAddDrug = () => {},
  onRemoveDrug = () => {},
  onUpdateDrug = () => {},
}) {
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/master/meds/drugs')
      .then((res) => {
        if (isMounted && Array.isArray(res?.data)) {
          setMasterMedicines(res.data);
        }
      })
      .catch(() => {
        // Fallback gracefully to manual typing
      });

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

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-serif font-bold text-sm flex items-center justify-center shadow-2xs">
            ℞
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              Medication &amp; Prescriptions
            </h3>
            <span className="text-[11px] font-medium text-slate-500">
              {medicines.length} medications listed
            </span>
          </div>
        </div>

        <button
          type="button"
          className="h-8.5 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          onClick={() => onAddDrug()}
          data-testid="btn-add-drug"
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
          <span>Add Drug</span>
        </button>
      </div>

      {/* 2. Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse"
          data-testid="rx-medication-table"
        >
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="w-12 py-2.5 px-3 text-center">#</th>
              <th className="w-44 py-2.5 px-2">Brand Name</th>
              <th className="min-w-[220px] py-2.5 px-2">Drug / Generic Name *</th>
              <th className="w-28 py-2.5 px-2">Dosage</th>
              <th className="w-36 py-2.5 px-2">Frequency</th>
              <th className="w-20 py-2.5 px-2 text-center">Days</th>
              <th className="w-40 py-2.5 px-2">Instructions</th>
              <th className="w-20 py-2.5 px-2 text-center">Qty</th>
              <th className="w-12 py-2.5 px-2 text-center">Del</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {medicines.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/70 transition-colors"
                data-testid={`rx-row-${idx}`}
              >
                {/* 1. S.No */}
                <td className="py-2 px-3 text-center font-mono font-bold text-xs text-slate-400">
                  {row.s_no || idx + 1}
                </td>

                {/* 2. Brand Name */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    className="w-full h-8.5 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs font-medium"
                    placeholder="e.g. Dolo 650"
                    value={row.brand_name || ''}
                    onChange={(e) => onUpdateDrug(idx, 'brand_name', e.target.value)}
                    data-testid={`input-brand-${idx}`}
                  />
                </td>

                {/* 3. Drug / Generic Name with Auto-Suggest */}
                <td className="py-2 px-2 relative">
                  <input
                    type="text"
                    className="w-full h-8.5 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs font-semibold"
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
                    <div className="absolute top-full left-2 right-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1 divide-y divide-slate-100">
                      {searchResults.map((m) => (
                        <div
                          key={m.id}
                          className="px-3 py-2 hover:bg-teal-50 cursor-pointer flex items-center gap-2 text-xs transition-colors"
                          onClick={() => handleSelectMasterDrug(idx, m)}
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
                <td className="py-2 px-2">
                  <input
                    type="text"
                    className="w-full h-8.5 px-2 text-center bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
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
                <td className="py-2 px-2">
                  <select
                    className="w-full h-8.5 px-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs cursor-pointer font-medium"
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
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="1"
                    className="w-full h-8.5 px-2 text-center bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
                    value={row.days !== undefined ? row.days : 5}
                    onChange={(e) =>
                      onUpdateDrug(idx, 'days', parseInt(e.target.value, 10) || 1)
                    }
                    data-testid={`input-days-${idx}`}
                  />
                </td>

                {/* 7. Instructions */}
                <td className="py-2 px-2">
                  <input
                    type="text"
                    className="w-full h-8.5 px-2.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
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
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="1"
                    className="w-full h-8.5 px-2 text-center bg-teal-50/70 border border-teal-300 rounded-md text-xs font-mono font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                    title="Auto-calculated quantity (editable)"
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

                {/* 9. Delete Action */}
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md mx-auto transition-colors cursor-pointer"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
