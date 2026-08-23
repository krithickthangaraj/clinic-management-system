import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { pharmacyService } from '../../services/pharmacyService';
import './PharmacyDashboard.css';

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'inventory'
  const [queue, setQueue] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dispensing Modal State
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDispensing, setIsDispensing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  // Fetch Queue and Inventory Data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [queueData, inventoryData] = await Promise.all([
        pharmacyService.getQueue(),
        pharmacyService.getInventory(),
      ]);
      setQueue(Array.isArray(queueData) ? queueData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (err) {
      console.error('Failed to load pharmacy records:', err);
      setErrorMessage('Unable to connect to clinic pharmacy server.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Open Dispense Details
  const handleOpenDispense = async (visitId) => {
    setSelectedVisitId(visitId);
    setLoadingDetails(true);
    setErrorMessage('');
    try {
      const details = await pharmacyService.getPrescription(visitId);
      setPrescriptionDetails(details);
    } catch (err) {
      console.error('Failed to load prescription:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to load prescription.');
      setSelectedVisitId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Perform Dispense
  const handleConfirmDispense = async () => {
    if (!selectedVisitId) return;
    setIsDispensing(true);
    setErrorMessage('');
    try {
      const res = await pharmacyService.dispense(selectedVisitId, { payment_mode: paymentMode });
      setSuccessMessage(res.message || 'Prescription successfully fulfilled and billed.');
      setSelectedVisitId(null);
      setPrescriptionDetails(null);
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Dispense error:', err);
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === 'string' ? detail : 'Fulfillment failed due to inventory shortage.');
    } finally {
      setIsDispensing(false);
    }
  };

  // KPI Calculations
  const totalStockItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.is_low_stock).length;
  const outOfStockCount = inventory.filter((i) => i.is_out_of_stock).length;
  const nearExpiryCount = inventory.filter((i) => i.is_near_expiry).length;

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    let list = Array.isArray(inventory) ? inventory : [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.brand_name.toLowerCase().includes(q) ||
          i.drug_name.toLowerCase().includes(q) ||
          i.batch_number.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      list = list.filter((i) => (i.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    if (stockStatusFilter === 'low_stock') {
      list = list.filter((i) => i.is_low_stock);
    } else if (stockStatusFilter === 'out_of_stock') {
      list = list.filter((i) => i.is_out_of_stock);
    } else if (stockStatusFilter === 'near_expiry') {
      list = list.filter((i) => i.is_near_expiry);
    }
    return list;
  }, [inventory, searchQuery, categoryFilter, stockStatusFilter]);

  return (
    <div className="pharmacy-dashboard-layout">
      <main className="pharmacy-dashboard-main">
        <div className="pharmacy-content-max">
          {/* 1. Header with Segmented Tabs & Date Badge */}
          <div className="pharmacy-desk-header">
            <div className="pharmacy-header-title-zone">
              <h1 className="pharmacy-desk-title">Pharmacy Desk</h1>
              <div className="pharmacy-date-badge" title="Today's Date">
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{todayFormatted}</span>
              </div>
            </div>

            {/* Segmented Control Pill Switcher */}
            <div className="pharmacy-segmented-tabs">
              <button
                type="button"
                className={`pharmacy-segmented-btn ${activeTab === 'queue' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('queue')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Pending Fulfillment</span>
                <span className="pharmacy-pill-badge">{queue.length}</span>
              </button>

              <button
                type="button"
                className={`pharmacy-segmented-btn ${activeTab === 'inventory' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Inventory Master</span>
                <span className="pharmacy-pill-badge">{totalStockItems}</span>
              </button>
            </div>

            {/* Sync Control */}
            <button
              type="button"
              className="pharmacy-btn-sync"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Live synchronize pharmacy data"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{refreshing ? 'Syncing…' : 'Live Sync'}</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center justify-between">
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">Dismiss</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold flex items-center justify-between">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900">Dismiss</button>
            </div>
          )}

          {/* 2. High-Density KPI Cards (Doctor Desk Style) */}
          <div className="pharmacy-kpis-container">
            <div
              className="pharmacy-kpi-card-item kpi-border-teal"
              onClick={() => {
                setActiveTab('inventory');
                setStockStatusFilter('all');
              }}
            >
              <div className="pharmacy-kpi-header">
                <span className="pharmacy-kpi-title">TOTAL MEDICINES</span>
                <svg className="pharmacy-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="pharmacy-kpi-val text-teal-700">{totalStockItems}</div>
            </div>

            <div
              className="pharmacy-kpi-card-item kpi-border-blue"
              onClick={() => setActiveTab('queue')}
            >
              <div className="pharmacy-kpi-header">
                <span className="pharmacy-kpi-title">PENDING DISPENSE</span>
                <svg className="pharmacy-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="pharmacy-kpi-val text-blue-700">{queue.length}</div>
            </div>

            <div
              className="pharmacy-kpi-card-item kpi-border-amber"
              onClick={() => {
                setActiveTab('inventory');
                setStockStatusFilter('low_stock');
              }}
            >
              <div className="pharmacy-kpi-header">
                <span className="pharmacy-kpi-title">LOW STOCK (≤ REORDER)</span>
                <svg className="pharmacy-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="pharmacy-kpi-val text-amber-600">{lowStockCount}</div>
            </div>

            <div
              className="pharmacy-kpi-card-item kpi-border-red"
              onClick={() => {
                setActiveTab('inventory');
                setStockStatusFilter('out_of_stock');
              }}
            >
              <div className="pharmacy-kpi-header">
                <span className="pharmacy-kpi-title">OUT OF STOCK (0)</span>
                <svg className="pharmacy-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="pharmacy-kpi-val text-red-600">{outOfStockCount}</div>
            </div>

            <div
              className="pharmacy-kpi-card-item kpi-border-rose"
              onClick={() => {
                setActiveTab('inventory');
                setStockStatusFilter('near_expiry');
              }}
            >
              <div className="pharmacy-kpi-header">
                <span className="pharmacy-kpi-title">EXPIRING SOON (&lt;30D)</span>
                <svg className="pharmacy-kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                </svg>
              </div>
              <div className="pharmacy-kpi-val text-rose-600">{nearExpiryCount}</div>
            </div>
          </div>

          {/* 3. TAB 1: Pending Prescriptions Queue */}
          {activeTab === 'queue' && (
            <div className="pharmacy-main-panel">
              <div className="pharmacy-panel-header">
                <span className="pharmacy-panel-title-text">
                  Doctor Completed Prescriptions &bull; Awaiting Dispensing ({queue.length})
                </span>
                <span className="text-xs text-slate-500 font-medium">Click any row to review &amp; dispense</span>
              </div>

              <div className="pharmacy-dense-table-wrapper">
                <table className="pharmacy-dense-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Token #</th>
                      <th style={{ width: '130px' }}>Patient ID</th>
                      <th>Patient Name</th>
                      <th>Age / Gender</th>
                      <th>Doctor</th>
                      <th>Prescribed Items</th>
                      <th>Pharmacy Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-400 font-medium">
                          No pending prescriptions in the fulfillment queue.
                        </td>
                      </tr>
                    ) : (
                      queue.map((item) => (
                        <tr
                          key={item.visit_id}
                          className="cursor-pointer"
                          onClick={() => handleOpenDispense(item.visit_id)}
                        >
                          <td>
                            <span className="pharmacy-token-badge">{item.visit_number}</span>
                          </td>
                          <td className="font-mono text-xs text-slate-600 font-semibold">{item.patient_id}</td>
                          <td className="font-bold text-slate-900">{item.patient_name}</td>
                          <td className="text-slate-600 text-xs">{item.age_sex}</td>
                          <td className="text-slate-700 font-medium text-xs">{item.doctor_name}</td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                              {item.items_count} Rx Items
                            </span>
                          </td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Pending Dispense
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="pharmacy-btn-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDispense(item.visit_id);
                              }}
                            >
                              <span>Dispense &amp; Bill</span>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TAB 2: Inventory Management Dashboard */}
          {activeTab === 'inventory' && (
            <div className="pharmacy-main-panel">
              <div className="pharmacy-panel-header flex-wrap">
                {/* Search Input */}
                <div className="relative w-80">
                  <input
                    type="text"
                    placeholder="Search Brand Name, Generic Drug, or Batch #..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <select
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-medium"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Dosage Forms</option>
                    <option value="Tablet">Tablets</option>
                    <option value="Syrup">Syrups</option>
                    <option value="Capsule">Capsules</option>
                    <option value="Injection">Injections</option>
                    <option value="Ointment">Ointments</option>
                    <option value="Drops">Drops</option>
                  </select>

                  <select
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-medium"
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                  >
                    <option value="all">All Stock Statuses</option>
                    <option value="low_stock">Low Stock (≤ Reorder)</option>
                    <option value="out_of_stock">Out of Stock (0)</option>
                    <option value="near_expiry">Near Expiry (&lt;30d)</option>
                  </select>
                </div>
              </div>

              <div className="pharmacy-dense-table-wrapper">
                <table className="pharmacy-dense-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Brand Name</th>
                      <th>Generic Drug Composition</th>
                      <th>Category</th>
                      <th>Batch #</th>
                      <th>Expiry Date</th>
                      <th>Stock Qty</th>
                      <th>Reorder</th>
                      <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                          No inventory items match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="font-bold text-slate-900">{item.brand_name}</td>
                          <td className="font-mono text-xs text-slate-600">{item.drug_name}</td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-slate-600">{item.batch_number}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs">{item.expiry_date}</span>
                              {item.is_near_expiry && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  Exp Soon
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {item.is_out_of_stock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                Out of Stock (0)
                              </span>
                            ) : item.is_low_stock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Low Stock ({item.stock_quantity})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                {item.stock_quantity} In Stock
                              </span>
                            )}
                          </td>
                          <td className="font-mono text-xs text-slate-500">{item.reorder_level}</td>
                          <td style={{ textAlign: 'right' }} className="font-mono font-bold text-slate-900">
                            ₹{item.unit_price.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 5. Split-Screen Dispensing & Billing Modal */}
      {selectedVisitId && (
        <div className="pharm-modal-backdrop">
          <div className="pharm-modal-card">
            <div className="pharm-modal-header">
              <div>
                <h3 className="font-bold text-sm">Prescription Fulfillment &amp; Pharmacy Billing</h3>
                {prescriptionDetails && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    {prescriptionDetails.patient_name} ({prescriptionDetails.patient_id}) &bull;{' '}
                    {prescriptionDetails.visit_number} &bull; {prescriptionDetails.doctor_name}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white"
                onClick={() => {
                  setSelectedVisitId(null);
                  setPrescriptionDetails(null);
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="pharm-modal-body">
              {loadingDetails ? (
                <div className="py-16 text-center text-slate-500 font-medium">Fetching doctor prescription &amp; inventory prices…</div>
              ) : prescriptionDetails ? (
                <div className="pharm-split-grid">
                  {/* Left Column: Doctor RX */}
                  <div className="pharm-subcard">
                    <h4 className="font-bold text-xs uppercase text-slate-600 mb-2.5 tracking-wider">Doctor Prescription</h4>
                    <div className="space-y-2.5">
                      {prescriptionDetails.medicines.map((m, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{m.s_no}. {m.brand_name}</span>
                            <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              Qty: {m.quantity}
                            </span>
                          </div>
                          <div className="text-slate-500 font-mono text-[11px] mt-0.5">{m.drug_name}</div>
                          <div className="text-slate-600 mt-1">
                            {m.dosage} &bull; {m.frequency} &bull; {m.days} Days
                            {m.instructions && <span> &bull; {m.instructions}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Inventory Matching & Billing */}
                  <div className="pharm-subcard">
                    <h4 className="font-bold text-xs uppercase text-slate-600 mb-2.5 tracking-wider">Matched Stock &amp; Billing</h4>
                    <div className="space-y-2.5">
                      {prescriptionDetails.medicines.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 border rounded text-xs ${
                            !m.is_in_stock ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{m.matched_brand_name || m.brand_name}</span>
                            <span className="font-mono font-bold text-slate-900">₹{m.total_price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-slate-500 text-[11px]">
                            <span>Batch: {m.batch_number || 'GEN-001'} &bull; ₹{m.unit_price.toFixed(2)}/unit</span>
                            <span>
                              {m.is_in_stock ? (
                                <strong className="text-emerald-700 font-bold">In Stock ({m.available_stock})</strong>
                              ) : (
                                <strong className="text-rose-600 font-bold">Shortage ({m.available_stock} avail)</strong>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Payment Mode Selector */}
                      <div className="pt-2.5 border-t border-slate-200 mt-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Cash', 'UPI', 'Card'].map((pm) => (
                            <button
                              key={pm}
                              type="button"
                              className={`py-1 text-xs font-bold rounded border text-center transition-colors ${
                                paymentMode === pm
                                  ? 'bg-teal-700 text-white border-teal-700'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                              onClick={() => setPaymentMode(pm)}
                            >
                              {pm}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Total Breakdown */}
                      <div className="p-2.5 bg-teal-50 border border-teal-200 rounded mt-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-900 uppercase">Total Bill Amount</span>
                        <span className="text-base font-extrabold text-teal-900 font-mono">
                          ₹{prescriptionDetails.total_estimated_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pharm-modal-footer">
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setSelectedVisitId(null);
                  setPrescriptionDetails(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`pharmacy-btn-action ${
                  isDispensing || !prescriptionDetails?.can_dispense ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={handleConfirmDispense}
                disabled={isDispensing || !prescriptionDetails?.can_dispense}
              >
                <span>
                  {isDispensing
                    ? 'Dispensing & Updating Stock…'
                    : `Dispense & Bill (₹${prescriptionDetails?.total_estimated_amount.toFixed(2) || '0.00'})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
