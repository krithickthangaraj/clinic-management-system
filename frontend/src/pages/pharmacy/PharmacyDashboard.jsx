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

  // Inventory CRUD Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);

  // Forms
  const [newItemForm, setNewItemForm] = useState({
    brand_name: '',
    drug_name: '',
    category: 'Tablet',
    batch_number: '',
    expiry_date: '',
    stock_quantity: 50,
    reorder_level: 20,
    unit_price: 10.0,
  });

  const [receiveStockForm, setReceiveStockForm] = useState({
    item_id: '',
    quantity_to_add: 50,
    batch_number: '',
    expiry_date: '',
    unit_price: '',
    reference_no: '',
    notes: '',
  });

  const [adjustStockForm, setAdjustStockForm] = useState({
    adjustment_type: 'deduct', // 'deduct', 'add', 'set'
    quantity: 1,
    reason: 'Breakage/Damage',
    notes: '',
  });

  const [editItemForm, setEditItemForm] = useState({
    brand_name: '',
    drug_name: '',
    category: 'Tablet',
    batch_number: '',
    expiry_date: '',
    reorder_level: 20,
    unit_price: 0.0,
  });

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

  // ---------------------------------------------------------------------------
  // Inventory CRUD Handlers
  // ---------------------------------------------------------------------------
  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    if (!newItemForm.brand_name || !newItemForm.drug_name || !newItemForm.batch_number || !newItemForm.expiry_date) {
      alert('Please fill all mandatory fields (Brand, Drug Name, Batch #, Expiry Date).');
      return;
    }

    setSavingItem(true);
    try {
      await pharmacyService.createInventoryItem({
        ...newItemForm,
        stock_quantity: parseInt(newItemForm.stock_quantity, 10) || 0,
        reorder_level: parseInt(newItemForm.reorder_level, 10) || 20,
        unit_price: parseFloat(newItemForm.unit_price) || 0,
      });
      setSuccessMessage(`'${newItemForm.brand_name}' successfully added to pharmacy inventory.`);
      setShowAddModal(false);
      setNewItemForm({
        brand_name: '',
        drug_name: '',
        category: 'Tablet',
        batch_number: '',
        expiry_date: '',
        stock_quantity: 50,
        reorder_level: 20,
        unit_price: 10.0,
      });
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to create inventory item:', err);
      alert(err.response?.data?.detail || 'Failed to add medicine to inventory.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleOpenReceiveModal = (item = null) => {
    setSelectedInventoryItem(item);
    setReceiveStockForm({
      item_id: item ? item.id : (inventory[0]?.id || ''),
      quantity_to_add: 50,
      batch_number: item ? item.batch_number : '',
      expiry_date: item ? item.expiry_date : '',
      unit_price: item ? item.unit_price : '',
      reference_no: '',
      notes: '',
    });
    setShowReceiveModal(true);
  };

  const handleReceiveStockSubmit = async (e) => {
    e.preventDefault();
    const itemId = receiveStockForm.item_id || selectedInventoryItem?.id;
    if (!itemId) {
      alert('Please select a medicine.');
      return;
    }
    const qty = parseInt(receiveStockForm.quantity_to_add, 10);
    if (!qty || qty <= 0) {
      alert('Please enter a valid received quantity (> 0).');
      return;
    }

    setSavingItem(true);
    try {
      const payload = {
        quantity_to_add: qty,
        batch_number: receiveStockForm.batch_number || undefined,
        expiry_date: receiveStockForm.expiry_date || undefined,
        unit_price: receiveStockForm.unit_price ? parseFloat(receiveStockForm.unit_price) : undefined,
        reference_no: receiveStockForm.reference_no || undefined,
        notes: receiveStockForm.notes || undefined,
      };
      await pharmacyService.receiveStock(itemId, payload);
      setSuccessMessage(`Successfully received +${qty} units into stock.`);
      setShowReceiveModal(false);
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to receive stock:', err);
      alert(err.response?.data?.detail || 'Failed to record stock receipt.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleOpenAdjustModal = (item) => {
    setSelectedInventoryItem(item);
    setAdjustStockForm({
      adjustment_type: 'deduct',
      quantity: 1,
      reason: 'Breakage/Damage',
      notes: '',
    });
    setShowAdjustModal(true);
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    const qty = parseInt(adjustStockForm.quantity, 10);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    if (!adjustStockForm.reason) {
      alert('Please select an adjustment reason.');
      return;
    }

    setSavingItem(true);
    try {
      await pharmacyService.adjustStock(selectedInventoryItem.id, adjustStockForm);
      setSuccessMessage(`Stock successfully adjusted for '${selectedInventoryItem.brand_name}'.`);
      setShowAdjustModal(false);
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to adjust stock:', err);
      alert(err.response?.data?.detail || 'Failed to adjust stock.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleOpenEditModal = (item) => {
    setSelectedInventoryItem(item);
    setEditItemForm({
      brand_name: item.brand_name,
      drug_name: item.drug_name,
      category: item.category || 'Tablet',
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      reorder_level: item.reorder_level,
      unit_price: item.unit_price,
    });
    setShowEditModal(true);
  };

  const handleEditItemSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    setSavingItem(true);
    try {
      await pharmacyService.updateInventoryItem(selectedInventoryItem.id, {
        ...editItemForm,
        reorder_level: parseInt(editItemForm.reorder_level, 10) || 20,
        unit_price: parseFloat(editItemForm.unit_price) || 0,
      });
      setSuccessMessage(`Updated details for '${editItemForm.brand_name}'.`);
      setShowEditModal(false);
      await fetchData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to update item:', err);
      alert(err.response?.data?.detail || 'Failed to update medicine details.');
    } finally {
      setSavingItem(false);
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
              <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">Dismiss</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold flex items-center justify-between">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900 cursor-pointer">Dismiss</button>
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

          {/* 4. TAB 2: Inventory Management Dashboard (Full CRUD) */}
          {activeTab === 'inventory' && (
            <div className="pharmacy-main-panel">
              <div className="pharmacy-panel-header flex items-center justify-between gap-3 overflow-x-auto">
                {/* Left: Search & Filter Controls in One Single Horizontal Line */}
                <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                  <div className="relative w-44 sm:w-56 shrink-0">
                    <input
                      type="text"
                      placeholder="Search Drug / Batch..."
                      className="w-full h-8 pl-7 pr-2 text-[11px] bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <select
                    className="w-24 sm:w-26 h-8 px-1.5 py-1 text-[11px] bg-white border border-slate-300 rounded-md text-slate-700 font-semibold shrink-0 truncate focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    data-testid="filter-inventory-forms"
                    title="Filter by Dosage Form"
                  >
                    <option value="all">All Forms</option>
                    <option value="Tablet">Tablets</option>
                    <option value="Syrup">Syrups</option>
                    <option value="Capsule">Capsules</option>
                    <option value="Injection">Injections</option>
                    <option value="Ointment">Ointments</option>
                    <option value="Drops">Drops</option>
                  </select>

                  <select
                    className="w-26 sm:w-28 h-8 px-1.5 py-1 text-[11px] bg-white border border-slate-300 rounded-md text-slate-700 font-semibold shrink-0 truncate focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs"
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                    data-testid="filter-inventory-status"
                    title="Filter by Stock Status"
                  >
                    <option value="all">All Status</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="near_expiry">Near Expiry</option>
                  </select>
                </div>

                {/* Right: Primary Action Buttons */}
                <div className="pharmacy-inventory-actions flex items-center gap-2 shrink-0 flex-nowrap">
                  <button
                    type="button"
                    className="pharmacy-btn-secondary-grn whitespace-nowrap"
                    onClick={() => handleOpenReceiveModal()}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Receive Stock (GRN)</span>
                  </button>

                  <button
                    type="button"
                    className="pharmacy-btn-primary-add whitespace-nowrap"
                    onClick={() => setShowAddModal(true)}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span>+ Add New Drug</span>
                  </button>
                </div>
              </div>

              <div className="pharmacy-dense-table-wrapper">
                <table className="pharmacy-dense-table">
                  <thead>
                    <tr>
                      <th style={{ width: '46px' }}>S.No</th>
                      <th>Brand Name</th>
                      <th>Drug Name</th>
                      <th>Category</th>
                      <th>Batch #</th>
                      <th>Expiry Date</th>
                      <th>Stock Qty</th>
                      <th>Reorder</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-12 text-slate-400 font-medium">
                          No inventory items match your search criteria.
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
                          <td style={{ textAlign: 'center' }}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                className="pharmacy-btn-table-sm pharmacy-btn-table-adjust"
                                onClick={() => handleOpenAdjustModal(item)}
                                title="Adjust Stock (Breakage, Count discrepancy, Expiry)"
                              >
                                Adjust
                              </button>
                              <button
                                type="button"
                                className="pharmacy-btn-table-sm"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Price, Batch or Expiry"
                              >
                                Edit
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
                className="text-slate-400 hover:text-white cursor-pointer"
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
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-1.5 px-2">Brand / Drug</th>
                          <th className="py-1.5 px-2">Dosage &amp; Freq</th>
                          <th className="py-1.5 px-2 text-center">Days</th>
                          <th className="py-1.5 px-2 text-center">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prescriptionDetails.medicines.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2">
                              <strong className="text-slate-900">{m.brand_name || m.drug_name}</strong>
                              <div className="text-[11px] text-slate-500 font-mono">{m.drug_name}</div>
                            </td>
                            <td className="py-1.5 px-2 text-slate-600">
                              {m.dosage} &bull; {m.frequency}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono">{m.days}</td>
                            <td className="py-1.5 px-2 text-center font-mono font-bold text-teal-800">{m.prescribed_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Inventory Matching & Bill */}
                  <div className="pharm-subcard">
                    <h4 className="font-bold text-xs uppercase text-slate-600 mb-2.5 tracking-wider">Inventory Match &amp; Bill Breakdown</h4>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="py-1.5 px-2">Matched Drug</th>
                          <th className="py-1.5 px-2 text-center">Stock</th>
                          <th className="py-1.5 px-2 text-right">Price</th>
                          <th className="py-1.5 px-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prescriptionDetails.medicines.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2">
                              <div className="font-semibold text-slate-900">{m.matched_item_name || 'No direct match'}</div>
                              <span className="text-[10px] text-slate-500 font-mono">{m.matched_batch || 'N/A'}</span>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              {m.in_stock ? (
                                <span className="font-mono text-emerald-700 font-bold">{m.current_stock}</span>
                              ) : (
                                <span className="font-mono text-red-600 font-bold">SHORT ({m.current_stock})</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">₹{m.unit_price.toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                              ₹{m.total_price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-700 text-sm">Estimated Total Amount:</span>
                      <span className="font-mono font-extrabold text-teal-800 text-base">
                        ₹{prescriptionDetails.total_estimated_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
                      <div className="flex gap-2">
                        {['Cash', 'UPI', 'Card'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={`flex-1 py-1.5 text-xs font-semibold rounded border cursor-pointer ${
                              paymentMode === mode
                                ? 'bg-teal-700 text-white border-teal-700'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                            onClick={() => setPaymentMode(mode)}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pharm-modal-footer">
              <button
                type="button"
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                onClick={() => {
                  setSelectedVisitId(null);
                  setPrescriptionDetails(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                disabled={isDispensing || !prescriptionDetails?.can_dispense}
                onClick={handleConfirmDispense}
              >
                {isDispensing ? 'Processing…' : 'Dispense & Bill (Fulfill RX)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add New Medicine Modal */}
      {showAddModal && (
        <div className="pharm-modal-backdrop">
          <div className="pharm-modal-card" style={{ maxWidth: '560px' }}>
            <div className="pharm-modal-header">
              <h3 className="font-bold text-sm">Register New Drug to Inventory</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setShowAddModal(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateMedicine}>
              <div className="pharm-modal-body space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Brand Name *</label>
                    <input
                      type="text"
                      className="pharm-form-input font-bold"
                      placeholder="e.g. Panpro 40mg Tab"
                      required
                      value={newItemForm.brand_name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, brand_name: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Generic Composition *</label>
                    <input
                      type="text"
                      className="pharm-form-input font-mono"
                      placeholder="e.g. Pantoprazole"
                      required
                      value={newItemForm.drug_name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, drug_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Dosage Form</label>
                    <select
                      className="pharm-form-select"
                      value={newItemForm.category}
                      onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                    </select>
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Batch # *</label>
                    <input
                      type="text"
                      className="pharm-form-input font-mono"
                      placeholder="e.g. BAT-2026-101"
                      required
                      value={newItemForm.batch_number}
                      onChange={(e) => setNewItemForm({ ...newItemForm, batch_number: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Expiry Date *</label>
                    <input
                      type="date"
                      className="pharm-form-input"
                      required
                      value={newItemForm.expiry_date}
                      onChange={(e) => setNewItemForm({ ...newItemForm, expiry_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      className="pharm-form-input font-mono font-bold"
                      value={newItemForm.stock_quantity}
                      onChange={(e) => setNewItemForm({ ...newItemForm, stock_quantity: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Reorder Level</label>
                    <input
                      type="number"
                      min="1"
                      className="pharm-form-input font-mono"
                      value={newItemForm.reorder_level}
                      onChange={(e) => setNewItemForm({ ...newItemForm, reorder_level: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="pharm-form-input font-mono font-bold"
                      value={newItemForm.unit_price}
                      onChange={(e) => setNewItemForm({ ...newItemForm, unit_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pharm-modal-footer">
                <button
                  type="button"
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  disabled={savingItem}
                >
                  {savingItem ? 'Saving…' : 'Register Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Receive Stock (GRN) Modal */}
      {showReceiveModal && (
        <div className="pharm-modal-backdrop">
          <div className="pharm-modal-card" style={{ maxWidth: '520px' }}>
            <div className="pharm-modal-header">
              <h3 className="font-bold text-sm">Receive Stock / Goods Receipt Note (GRN)</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setShowReceiveModal(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit}>
              <div className="pharm-modal-body space-y-3">
                <div className="pharm-form-group">
                  <label className="pharm-form-label">Select Medicine *</label>
                  <select
                    className="pharm-form-select font-bold"
                    value={receiveStockForm.item_id}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      const selected = inventory.find((i) => i.id === id);
                      setReceiveStockForm({
                        ...receiveStockForm,
                        item_id: id,
                        batch_number: selected?.batch_number || '',
                        expiry_date: selected?.expiry_date || '',
                        unit_price: selected?.unit_price || '',
                      });
                    }}
                    required
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.brand_name} ({item.drug_name}) &bull; Cur Stock: {item.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Quantity to Add *</label>
                    <input
                      type="number"
                      min="1"
                      className="pharm-form-input font-mono font-bold text-teal-800"
                      required
                      value={receiveStockForm.quantity_to_add}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, quantity_to_add: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">GRN / PO Ref #</label>
                    <input
                      type="text"
                      className="pharm-form-input font-mono"
                      placeholder="e.g. PO-8821"
                      value={receiveStockForm.reference_no}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, reference_no: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Batch # (Optional update)</label>
                    <input
                      type="text"
                      className="pharm-form-input font-mono"
                      value={receiveStockForm.batch_number}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, batch_number: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Expiry Date</label>
                    <input
                      type="date"
                      className="pharm-form-input"
                      value={receiveStockForm.expiry_date}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, expiry_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pharm-modal-footer">
                <button
                  type="button"
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setShowReceiveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  disabled={savingItem}
                >
                  {savingItem ? 'Receiving…' : 'Confirm Stock Receipt (+)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Stock Adjustment Modal */}
      {showAdjustModal && selectedInventoryItem && (
        <div className="pharm-modal-backdrop">
          <div className="pharm-modal-card" style={{ maxWidth: '480px' }}>
            <div className="pharm-modal-header">
              <h3 className="font-bold text-sm">Manual Stock Adjustment</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setShowAdjustModal(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit}>
              <div className="pharm-modal-body space-y-3">
                <div className="p-2.5 bg-slate-100 rounded-md border border-slate-200">
                  <div className="font-bold text-slate-900 text-xs">{selectedInventoryItem.brand_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Current Stock: <strong>{selectedInventoryItem.stock_quantity} units</strong> &bull; Batch: {selectedInventoryItem.batch_number}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Adjustment Type *</label>
                    <select
                      className="pharm-form-select font-semibold"
                      value={adjustStockForm.adjustment_type}
                      onChange={(e) => setAdjustStockForm({ ...adjustStockForm, adjustment_type: e.target.value })}
                    >
                      <option value="deduct">Deduct / Remove (-)</option>
                      <option value="add">Add / Found (+)</option>
                      <option value="set">Set Exact Count (=)</option>
                    </select>
                  </div>

                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="pharm-form-input font-mono font-bold"
                      required
                      value={adjustStockForm.quantity}
                      onChange={(e) => setAdjustStockForm({ ...adjustStockForm, quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pharm-form-group">
                  <label className="pharm-form-label">Reason *</label>
                  <select
                    className="pharm-form-select"
                    value={adjustStockForm.reason}
                    onChange={(e) => setAdjustStockForm({ ...adjustStockForm, reason: e.target.value })}
                    required
                  >
                    <option value="Breakage/Damage">Breakage / Damaged Goods</option>
                    <option value="Physical Audit Discrepancy">Physical Audit Discrepancy</option>
                    <option value="Expired Goods">Expired Goods Disposal</option>
                    <option value="Correction">Billing / Entry Correction</option>
                    <option value="Other">Other Operational Adjustment</option>
                  </select>
                </div>

                <div className="pharm-form-group">
                  <label className="pharm-form-label">Explanation / Notes</label>
                  <input
                    type="text"
                    className="pharm-form-input text-xs"
                    placeholder="e.g. Vial cracked during shelving"
                    value={adjustStockForm.notes}
                    onChange={(e) => setAdjustStockForm({ ...adjustStockForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="pharm-modal-footer">
                <button
                  type="button"
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  disabled={savingItem}
                >
                  {savingItem ? 'Adjusting…' : 'Apply Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Edit Details Modal */}
      {showEditModal && selectedInventoryItem && (
        <div className="pharm-modal-backdrop">
          <div className="pharm-modal-card" style={{ maxWidth: '520px' }}>
            <div className="pharm-modal-header">
              <h3 className="font-bold text-sm">Edit Medicine Details</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setShowEditModal(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit}>
              <div className="pharm-modal-body space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Brand Name</label>
                    <input
                      type="text"
                      className="pharm-form-input font-bold"
                      value={editItemForm.brand_name}
                      onChange={(e) => setEditItemForm({ ...editItemForm, brand_name: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Generic Drug</label>
                    <input
                      type="text"
                      className="pharm-form-input font-mono"
                      value={editItemForm.drug_name}
                      onChange={(e) => setEditItemForm({ ...editItemForm, drug_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Batch Number</label>
                    <input
                      type="text"
                      className="pharm-form-input font-mono"
                      value={editItemForm.batch_number}
                      onChange={(e) => setEditItemForm({ ...editItemForm, batch_number: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Expiry Date</label>
                    <input
                      type="date"
                      className="pharm-form-input"
                      value={editItemForm.expiry_date}
                      onChange={(e) => setEditItemForm({ ...editItemForm, expiry_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Reorder Level</label>
                    <input
                      type="number"
                      min="1"
                      className="pharm-form-input font-mono"
                      value={editItemForm.reorder_level}
                      onChange={(e) => setEditItemForm({ ...editItemForm, reorder_level: e.target.value })}
                    />
                  </div>
                  <div className="pharm-form-group">
                    <label className="pharm-form-label">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="pharm-form-input font-mono font-bold text-teal-800"
                      value={editItemForm.unit_price}
                      onChange={(e) => setEditItemForm({ ...editItemForm, unit_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pharm-modal-footer">
                <button
                  type="button"
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  disabled={savingItem}
                >
                  {savingItem ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
