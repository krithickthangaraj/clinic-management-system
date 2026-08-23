import React, { useState, useEffect } from 'react';
import { CLINICAL_TEMPLATES } from '../../hooks/usePrescriptionForm';
import SaveTemplateModal from './SaveTemplateModal';

/**
 * Separate TemplateEngineSection Component
 * Features:
 * - Collapsible accordion header with chevron toggle arrow button (like Medical History)
 * - Searchable / Select template dropdown
 * - "Save Current as Template" button
 * - Even spacing & padding aligned with Medical History
 */
export default function TemplateEngineSection({
  medicines = [],
  onLoadTemplate = () => {},
  onAddDrug = () => {},
  onUpdateDrug = () => {},
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [customTemplates, setCustomTemplates] = useState({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clinic_custom_templates_v1');
      if (stored) {
        setCustomTemplates(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleSaveNewTemplate = (name, drugs) => {
    const key = `custom_${Date.now()}`;
    const validDrugs = drugs.filter((d) => d.drug_name && d.drug_name.trim());
    const newT = { name, medicines: validDrugs };
    const updated = { ...customTemplates, [key]: newT };
    setCustomTemplates(updated);
    try {
      localStorage.setItem('clinic_custom_templates_v1', JSON.stringify(updated));
    } catch {}
  };

  const allTemplates = { ...CLINICAL_TEMPLATES, ...customTemplates };

  return (
    <section
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
      data-testid="template-engine-section"
    >
      {/* 1. Collapsible Accordion Header Bar */}
      <div
        className="px-5 py-3 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        data-testid="btn-toggle-templates"
      >
        <div className="flex items-center gap-2.5">
          <svg
            className="w-4 h-4 text-teal-700 shrink-0"
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
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Clinical Protocols &amp; Templates
          </h3>
        </div>

        {/* Toggle Chevron Arrow Button */}
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Toggle templates panel"
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

      {/* 2. Collapsible Body */}
      {isOpen && (
        <div className="p-5 space-y-3.5 bg-white" data-testid="templates-body">
          {/* Searchable / Select Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Load Template
            </label>
            <select
              className="w-full h-10 px-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs cursor-pointer transition-all"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  const val = e.target.value;
                  if (customTemplates[val]) {
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
                Select Template...
              </option>
              {Object.entries(allTemplates).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save Current as Template Button with Teal Icon */}
          <button
            type="button"
            className="w-full h-10 px-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-200 text-slate-700 hover:text-emerald-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => setIsSaveModalOpen(true)}
            title="Save current medications as a reusable template"
            data-testid="btn-save-as-template"
          >
            <svg
              className="w-4 h-4 text-emerald-700"
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
            <span>Save Current as Template</span>
          </button>
        </div>
      )}

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        medicines={medicines}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveTemplate={handleSaveNewTemplate}
      />
    </section>
  );
}
