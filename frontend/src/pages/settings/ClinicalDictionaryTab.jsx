import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

const DICTIONARY_CATEGORIES = [
  { key: 'complaints', label: 'Chief Complaints', desc: 'Patient symptoms and presenting complaints' },
  { key: 'diagnosis', label: 'Clinical Diagnoses', desc: 'Provisional and confirmed diagnoses' },
  { key: 'advice', label: 'Doctor Advice & Instructions', desc: 'Dietary, lifestyle and clinical advice' },
  { key: 'procedures', label: 'Clinical Procedures', desc: 'Minor OPD procedures, injections, dressings' },
  { key: 'referrals', label: 'Specialist Referrals', desc: 'Referral specialists and partner departments' },
  { key: 'lab_tests', label: 'Laboratory Investigations', desc: 'Blood routines, panels, imaging tests' },
];

export default function ClinicalDictionaryTab({ onToast }) {
  const [selectedCategory, setSelectedCategory] = useState('complaints');
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termForm, setTermForm] = useState({ name: '', specialty: '', test_type: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategoryTerms();
  }, [selectedCategory]);

  const loadCategoryTerms = async () => {
    try {
      setLoading(true);
      const data = await settingsService.listDictionary(selectedCategory);
      setTerms(data);
    } catch (err) {
      console.error('Failed to load dictionary terms:', err);
      onToast('error', `Failed to load terms for ${selectedCategory}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!termForm.name.trim()) return;
    try {
      setSubmitting(true);
      await settingsService.addDictionaryTerm(selectedCategory, termForm);
      onToast('success', `Added "${termForm.name}" to dictionary.`);
      setShowAddModal(false);
      setTermForm({ name: '', specialty: '', test_type: '' });
      loadCategoryTerms();
    } catch (err) {
      console.error('Add term failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to add dictionary term.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTerm.name.trim()) return;
    try {
      setSubmitting(true);
      await settingsService.updateDictionaryTerm(selectedCategory, editingTerm.id, editingTerm);
      onToast('success', `Updated "${editingTerm.name}" successfully.`);
      setEditingTerm(null);
      loadCategoryTerms();
    } catch (err) {
      console.error('Update term failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to update term.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (term) => {
    if (!window.confirm(`Are you sure you want to deactivate "${term.name}"?`)) return;
    try {
      await settingsService.deleteDictionaryTerm(selectedCategory, term.id);
      onToast('success', `Deactivated "${term.name}".`);
      setTerms((prev) => prev.filter((t) => t.id !== term.id));
    } catch (err) {
      console.error('Deactivate failed:', err);
      onToast('error', err.response?.data?.detail || 'Failed to deactivate term.');
    }
  };

  const currentCatInfo = DICTIONARY_CATEGORIES.find((c) => c.key === selectedCategory) || DICTIONARY_CATEGORIES[0];

  const filteredTerms = terms.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    (t.specialty && t.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Category Selection & Action Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[280px]">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Category:</label>
            <select
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSearch('');
              }}
              data-testid="select-dictionary-category"
            >
              {DICTIONARY_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Terms */}
          <div className="relative w-56 sm:w-64">
            <input
              type="text"
              placeholder={`Search ${currentCatInfo.label}...`}
              className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Add Term Button */}
        <button
          type="button"
          onClick={() => {
            setTermForm({ name: '', specialty: '', test_type: '' });
            setShowAddModal(true);
          }}
          className="h-9 px-4.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
          data-testid="btn-add-dictionary-term"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Add Term</span>
        </button>
      </div>

      {/* Category Info Banner */}
      <div className="px-4 py-2 bg-teal-50/50 border border-teal-200/60 rounded-lg flex items-center justify-between text-xs text-teal-900 font-medium">
        <span>Managing values for: <strong className="font-bold">{currentCatInfo.label}</strong> &mdash; {currentCatInfo.desc}</span>
        <span className="font-bold font-mono">{filteredTerms.length} active terms</span>
      </div>

      {/* Dictionary Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-14">#</th>
                <th className="py-3 px-4">Term / Clinical Name</th>
                {(selectedCategory === 'referrals' || selectedCategory === 'lab_tests') && (
                  <th className="py-3 px-4">Specialty / Type</th>
                )}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading clinical terms...
                  </td>
                </tr>
              ) : filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No terms found in {currentCatInfo.label}. Click "+ Add Term" to register one.
                  </td>
                </tr>
              ) : (
                filteredTerms.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.name}
                    </td>
                    {(selectedCategory === 'referrals' || selectedCategory === 'lab_tests') && (
                      <td className="py-3 px-4 text-slate-600">
                        {item.specialty || item.test_type || '—'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTerm({ ...item })}
                          className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-md transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(item)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: ADD TERM --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add to {currentCatInfo.label}</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term / Clinical Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  placeholder="e.g. Acute Bronchitis, Nebulization, etc."
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold text-slate-900"
                />
              </div>

              {selectedCategory === 'referrals' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={termForm.specialty}
                    onChange={(e) => setTermForm({ ...termForm, specialty: e.target.value })}
                    placeholder="e.g. Cardiology, Neurology"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}

              {selectedCategory === 'lab_tests' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Type / Panel</label>
                  <input
                    type="text"
                    value={termForm.test_type}
                    onChange={(e) => setTermForm({ ...termForm, test_type: e.target.value })}
                    placeholder="e.g. Hematology, Biochemistry, Radiology"
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT TERM --- */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Dictionary Term</h3>
              <button
                type="button"
                onClick={() => setEditingTerm(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term Name</label>
                <input
                  type="text"
                  required
                  value={editingTerm.name}
                  onChange={(e) => setEditingTerm({ ...editingTerm, name: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-semibold text-slate-900"
                />
              </div>

              {selectedCategory === 'referrals' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={editingTerm.specialty || ''}
                    onChange={(e) => setEditingTerm({ ...editingTerm, specialty: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}

              {selectedCategory === 'lab_tests' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Type / Panel</label>
                  <input
                    type="text"
                    value={editingTerm.test_type || ''}
                    onChange={(e) => setEditingTerm({ ...editingTerm, test_type: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTerm(null)}
                  className="h-9 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
