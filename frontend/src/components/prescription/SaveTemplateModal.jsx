import React, { useState } from 'react';

export default function SaveTemplateModal({
  isOpen = false,
  medicines = [],
  onClose = () => {},
  onSaveTemplate = () => {},
}) {
  const [templateName, setTemplateName] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (templateName.trim()) {
      onSaveTemplate(templateName.trim(), medicines);
      setTemplateName('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      data-testid="save-template-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-700"
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
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Save as Prescription Template
            </h3>
          </div>

          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={onClose}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="p-5 space-y-4" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Template Name
            </label>
            <input
              type="text"
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              placeholder="e.g., Post-Op Antibiotic Protocol, Pediatric Fever Kit..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
              required
              data-testid="input-template-name"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Included Medications ({medicines.filter((m) => m.drug_name).length}):
            </span>
            <ul className="text-xs text-slate-700 space-y-0.5 max-h-24 overflow-y-auto">
              {medicines
                .filter((m) => m.drug_name)
                .map((m, i) => (
                  <li key={i} className="truncate">
                    &bull; <strong className="font-semibold">{m.drug_name}</strong>{' '}
                    {m.brand_name && `(${m.brand_name})`} - {m.frequency} &times; {m.days}d
                  </li>
                ))}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              className="h-9 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              data-testid="btn-confirm-save-template"
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
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
