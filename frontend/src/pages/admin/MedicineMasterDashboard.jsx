import React, { useState, useEffect, useCallback, useMemo } from 'react';
import medicineService from '../../services/medicineService';
import './MedicineMasterDashboard.css';

const CATEGORY_OPTIONS = ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Ointment', 'Drops'];

const FREQUENCY_OPTIONS = [
  'OD (1-0-0)',
  'BD (1-0-1)',
  'TDS (1-1-1)',
  'QID (1-1-1-1)',
  'HS (0-0-1)',
  'SOS',
  'STAT',
  'QW (Once weekly)',
];

const DOSAGE_OPTIONS = [
  '1 Tab',
  '2 Tabs',
  '0.5 Tab',
  '1 Cap',
  '2 Caps',
  '5ml',
  '7.5ml',
  '10ml',
  '15ml',
  '1 Inj',
  'Apply',
  '1 Drop',
  '1 Puff',
];

export default function MedicineMasterDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    brand_name: '',
    drug_name: '',
    category: 'Tablet',
    default_dosage: '1 Tab',
    default_frequency: 'TDS (1-1-1)',
    default_days: 3,
    default_instructions: '',
  });

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  // Fetch Master Data
  const fetchMedicines = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await medicineService.listMedicineMaster({ limit: 300 });
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load medicine master:', err);
      setErrorMessage('Unable to load clinical dictionary from server.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      brand_name: '',
      drug_name: '',
      category: 'Tablet',
      default_dosage: '1 Tab',
      default_frequency: 'TDS (1-1-1)',
      default_days: 3,
      default_instructions: '',
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      brand_name: item.brand_name || '',
      drug_name: item.drug_name || '',
      category: item.category || 'Tablet',
      default_dosage: item.default_dosage || '1 Tab',
      default_frequency: item.default_frequency || 'TDS (1-1-1)',
      default_days: item.default_days ?? 3,
      default_instructions: item.default_instructions || '',
    });
    setShowModal(true);
  };

  // Save (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand_name.trim() || !form.drug_name.trim()) {
      alert('Brand Name and Generic Drug Name are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await medicineService.updateMedicineMaster(editingItem.id, {
          ...form,
          default_days: parseInt(form.default_days, 10) || 1,
        });
        setSuccessMessage(`Updated template for '${form.brand_name}'.`);
      } else {
        await medicineService.createMedicineMaster({
          ...form,
          default_days: parseInt(form.default_days, 10) || 1,
        });
        setSuccessMessage(`Registered new master drug '${form.brand_name}'.`);
      }

      setShowModal(false);
      await fetchMedicines();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to save master template:', err);
      alert(err.response?.data?.detail || 'Failed to save medicine master item.');
    } finally {
      setSaving(false);
    }
  };

  // Deactivate
  const handleDeactivate = async (item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to deactivate '${item.brand_name}'? It will no longer appear in prescription auto-complete.`
    );
    if (!confirmDelete) return;

    try {
      await medicineService.deleteMedicineMaster(item.id);
      setSuccessMessage(`Deactivated '${item.brand_name}' from Medicine Master.`);
      await fetchMedicines();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to deactivate item:', err);
      alert(err.response?.data?.detail || 'Failed to deactivate item.');
    }
  };

  // KPIs
  const totalItems = medicines.length;
  const tabletsCount = medicines.filter((m) => m.category === 'Tablet').length;
  const syrupsCount = medicines.filter((m) => m.category === 'Syrup').length;
  const injectionsCount = medicines.filter((m) => m.category === 'Injection' || m.category === 'Capsule').length;

  // Filtered List
  const filteredMedicines = useMemo(() => {
    let list = Array.isArray(medicines) ? medicines : [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.brand_name?.toLowerCase().includes(q) ||
          m.drug_name?.toLowerCase().includes(q) ||
          m.default_instructions?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      list = list.filter((m) => (m.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    return list;
  }, [medicines, searchQuery, categoryFilter]);

  return (
    <div className="medmaster-dashboard-layout">
      <main className="medmaster-dashboard-main">
        <div className="medmaster-content-max">
          {/* 1. Header */}
          <div className="medmaster-header">
            <div className="medmaster-title-zone">
              <div>
                <h1 className="medmaster-title">Medicine Master (Clinical Dictionary)</h1>
                <p className="medmaster-subtitle">
                  Global prescription defaults (Dosage, Frequency, Regimen) for Doctor's RX "Magic Auto-Fill"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="medmaster-btn-add"
                onClick={handleOpenCreate}
                data-testid="btn-add-master-drug"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Add Master Drug</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center justify-between">
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">Dismiss</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold flex items-center justify-between">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900 cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* 2. KPI Bar */}
          <div className="medmaster-kpis-grid">
            <div className="medmaster-kpi-card kpi-teal">
              <span className="medmaster-kpi-title">TOTAL MASTER DRUGS</span>
              <div className="medmaster-kpi-val text-teal-700">{totalItems}</div>
            </div>
            <div className="medmaster-kpi-card kpi-blue">
              <span className="medmaster-kpi-title">TABLETS</span>
              <div className="medmaster-kpi-val text-blue-700">{tabletsCount}</div>
            </div>
            <div className="medmaster-kpi-card kpi-amber">
              <span className="medmaster-kpi-title">SYRUPS</span>
              <div className="medmaster-kpi-val text-amber-600">{syrupsCount}</div>
            </div>
            <div className="medmaster-kpi-card kpi-purple">
              <span className="medmaster-kpi-title">CAPSULES &amp; INJECTIONS</span>
              <div className="medmaster-kpi-val text-purple-700">{injectionsCount}</div>
            </div>
          </div>

          {/* 3. Main Data Table Panel */}
          <div className="medmaster-panel">
            <div className="medmaster-panel-header">
              {/* Search Bar */}
              <div className="relative w-80">
                <input
                  type="text"
                  placeholder="Search Brand Name, Generic Composition..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-master"
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <select
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 font-medium"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Tablet">Tablets</option>
                  <option value="Syrup">Syrups</option>
                  <option value="Capsule">Capsules</option>
                  <option value="Injection">Injections</option>
                  <option value="Ointment">Ointments</option>
                  <option value="Drops">Drops</option>
                </select>

                <button
                  type="button"
                  className="medmaster-btn-action"
                  onClick={() => fetchMedicines(true)}
                  disabled={refreshing}
                  title="Refresh dictionary"
                >
                  <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>{refreshing ? 'Syncing…' : 'Sync'}</span>
                </button>
              </div>
            </div>

            <div className="medmaster-dense-table-wrapper">
              <table className="medmaster-dense-table">
                <thead>
                  <tr>
                    <th style={{ width: '46px' }}>S.No</th>
                    <th style={{ width: '220px' }}>Brand Name</th>
                    <th>Drug Name</th>
                    <th style={{ width: '100px' }}>Category</th>
                    <th style={{ width: '100px' }}>Dosage</th>
                    <th style={{ width: '140px' }}>Frequency</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Days</th>
                    <th>Instructions</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                        Loading clinical medicine dictionary…
                      </td>
                    </tr>
                  ) : filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                        No medicine master records match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((item, idx) => (
                      <tr key={item.id} data-testid={`master-row-${idx}`}>
                        <td className="text-slate-400 font-mono text-xs">{idx + 1}</td>
                        <td className="font-bold text-slate-900">{item.brand_name}</td>
                        <td className="font-mono text-xs text-slate-600">{item.drug_name}</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category || 'Tablet'}
                          </span>
                        </td>
                        <td className="font-medium text-slate-800">{item.default_dosage || '1 Tab'}</td>
                        <td>
                          <span className="medmaster-freq-badge">{item.default_frequency || 'TDS'}</span>
                        </td>
                        <td className="text-center font-mono font-bold text-slate-800">{item.default_days || 3}</td>
                        <td className="text-xs text-slate-600 italic">
                          {item.default_instructions || <span className="text-slate-300">None</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              className="medmaster-btn-action"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Prescribing Defaults"
                              data-testid={`btn-edit-master-${idx}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="medmaster-btn-action medmaster-btn-deactivate"
                              onClick={() => handleDeactivate(item)}
                              title="Deactivate Drug Template"
                              data-testid={`btn-delete-master-${idx}`}
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
        </div>
      </main>

      {/* 4. Add / Edit Master Drug Modal */}
      {showModal && (
        <div className="medmaster-modal-backdrop">
          <div className="medmaster-modal-card">
            <div className="medmaster-modal-header">
              <h3 className="font-bold text-sm">
                {editingItem ? `Edit Template: ${editingItem.brand_name}` : 'Register New Master Drug Template'}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="medmaster-modal-body space-y-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Brand Name *</label>
                    <input
                      type="text"
                      className="h-10 px-3 text-xs font-bold bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                      placeholder="e.g. Panpro 40mg Tab."
                      required
                      value={form.brand_name}
                      onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                      data-testid="input-modal-brand"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Drug Name *</label>
                    <input
                      type="text"
                      className="h-10 px-3 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                      placeholder="e.g. Pantoprazole"
                      required
                      value={form.drug_name}
                      onChange={(e) => setForm({ ...form, drug_name: e.target.value })}
                      data-testid="input-modal-drug"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Category</label>
                    <select
                      className="h-10 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-medium"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      data-testid="select-modal-category"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Default Dosage</label>
                    <select
                      className="h-10 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-medium"
                      value={form.default_dosage}
                      onChange={(e) => setForm({ ...form, default_dosage: e.target.value })}
                      data-testid="select-modal-dosage"
                    >
                      {DOSAGE_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Default Days</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="h-10 px-3 text-xs text-center font-mono font-bold bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                      value={form.default_days}
                      onChange={(e) => setForm({ ...form, default_days: e.target.value })}
                      data-testid="input-modal-days"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Default Frequency</label>
                    <select
                      className="h-10 px-2.5 text-xs bg-white border border-slate-300 rounded-md font-bold text-teal-800"
                      value={form.default_frequency}
                      onChange={(e) => setForm({ ...form, default_frequency: e.target.value })}
                      data-testid="select-modal-frequency"
                    >
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Default Instructions</label>
                    <input
                      type="text"
                      className="h-10 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                      placeholder="e.g. Before Food, After lunch"
                      value={form.default_instructions}
                      onChange={(e) => setForm({ ...form, default_instructions: e.target.value })}
                      data-testid="input-modal-instructions"
                    />
                  </div>
                </div>
              </div>

              <div className="medmaster-modal-footer">
                <button
                  type="button"
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  disabled={saving}
                  data-testid="btn-modal-submit"
                >
                  {saving ? 'Saving…' : editingItem ? 'Update Master Template' : 'Save to Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
