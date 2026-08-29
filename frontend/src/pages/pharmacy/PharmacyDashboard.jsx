import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { pharmacyService } from '../../services/pharmacyService';
import DispenseQueueList from '../../components/pharmacy/DispenseQueueList';
import DispensingWorkspace from '../../components/pharmacy/DispensingWorkspace';
import StockReplenishModal from '../../components/pharmacy/StockReplenishModal';
import './PharmacyDashboard.css';

/**
 * PharmacyDashboard - Master Clinical Pharmacy Workspace
 * Features 2-column split-pane dispense reconciliation desk & complete inventory management.
 */
export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'inventory'
  const [queue, setQueue] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dispensing State
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDispensing, setIsDispensing] = useState(false);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);

  // Inventory Filters
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState('all');
  const [invStatus, setInvStatus] = useState('all');

  // Add Item Form
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

  // Fetch Queue and Inventory Data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [queueData, inventoryData] = await Promise.all([
        pharmacyService.getQueue(),
        pharmacyService.getInventory(),
      ]);
      const q = Array.isArray(queueData) ? queueData : [];
      setQueue(q);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);

      // Auto-select first pending item ONLY if an active pending order exists
      if (q.length > 0) {
        const firstPending = q.find(
          (item) => String(item.pharmacy_status || item.status || '').toLowerCase() !== 'dispensed'
        );
        if (firstPending) {
          if (!selectedVisitId) {
            handleOpenDispense(firstPending.visit_id || firstPending.prescription_id);
          }
        } else if (!selectedVisitId) {
          // Zero pending items: show clean workspace
          setPrescriptionDetails(null);
        }
      } else {
        setPrescriptionDetails(null);
        setSelectedVisitId(null);
      }
    } catch (err) {
      console.error('Failed to load pharmacy records:', err);
      setErrorMessage('Unable to connect to clinic pharmacy server.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [selectedVisitId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Open Dispense Details for a Selected Visit
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
    } finally {
      setLoadingDetails(false);
    }
  };

  // Confirm Dispensing Action
  const handleConfirmDispense = async (payloadOrDetails, paymentMode = 'Cash', totalAmount = 0) => {
    if (!selectedVisitId) return;
    try {
      setIsDispensing(true);
      setErrorMessage('');

      let payload = {};
      if (payloadOrDetails && payloadOrDetails.dispensed_items) {
        payload = payloadOrDetails;
      } else {
        payload = { payment_mode: paymentMode, total_amount: totalAmount };
      }

      await pharmacyService.dispense(selectedVisitId, payload);
      setSuccessMessage('✓ Medications successfully dispensed and stock deducted.');
      setSelectedVisitId(null);
      setPrescriptionDetails(null);
      await fetchData(true);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Dispense failed:', err);
      setErrorMessage(err.response?.data?.detail || 'Dispense action failed. Please retry.');
    } finally {
      setIsDispensing(false);
    }
  };

  // Handle Quick Stock Replenish
  const handleSaveStockAdjustment = async (payload) => {
    try {
      setSavingItem(true);
      await pharmacyService.adjustStock(payload.item_id, payload);
      setSuccessMessage('✓ Inventory balance updated successfully.');
      setShowAdjustModal(false);
      await fetchData(true);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Stock adjustment failed:', err);
      setErrorMessage('Failed to adjust stock. Please retry.');
    } finally {
      setSavingItem(false);
    }
  };

  // Handle Add New Inventory Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      setSavingItem(true);
      await pharmacyService.createInventoryItem(newItemForm);
      setSuccessMessage(`✓ "${newItemForm.brand_name}" added to inventory.`);
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
      await fetchData(true);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Create item failed:', err);
      setErrorMessage('Failed to create inventory item.');
    } finally {
      setSavingItem(false);
    }
  };

  // Filtered Inventory
  const filteredInventory = inventory.filter((item) => {
    if (invCategory !== 'all' && item.category?.toLowerCase() !== invCategory.toLowerCase()) {
      return false;
    }
    if (invStatus === 'low_stock' && !item.is_low_stock) return false;
    if (invStatus === 'out_of_stock' && !item.is_out_of_stock) return false;
    if (invStatus === 'near_expiry' && !item.is_near_expiry) return false;

    if (!invSearch.trim()) return true;
    const q = invSearch.toLowerCase().trim();
    return (
      (item.brand_name || '').toLowerCase().includes(q) ||
      (item.drug_name || '').toLowerCase().includes(q) ||
      (item.batch_number || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-54px)] bg-slate-50 font-sans antialiased overflow-hidden">
      {/* 1. Master Sub-Nav & Mode Switcher Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Hospital Pharmacy &amp; Dispensing Desk
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispense Desk ({queue.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory &amp; Stock ({inventory.length})
            </button>
          </div>
        </div>

        {/* Action button */}
        {activeTab === 'inventory' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>+ Add Drug Item</span>
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="font-black text-sm">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="font-black text-sm">
            &times;
          </button>
        </div>
      )}

      {/* 2. Main Tab Viewports */}
      {activeTab === 'queue' ? (
        /* Split 2-Column Responsive Dispense Desk */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Pane: Real-Time Queue */}
          <DispenseQueueList
            queue={queue}
            selectedVisitId={selectedVisitId}
            onSelectVisit={(item) =>
              handleOpenDispense(item.visit_id || item.prescription_id)
            }
            onRefresh={() => fetchData(true)}
            refreshing={refreshing}
          />

          {/* Right Pane: Master Dispensing Workspace */}
          <DispensingWorkspace
            prescriptionDetails={prescriptionDetails}
            loading={loadingDetails}
            onDispense={handleConfirmDispense}
            isDispensing={isDispensing}
            onOpenStockReplenish={(item) => {
              setSelectedInventoryItem(item);
              setShowAdjustModal(true);
            }}
          />
        </div>
      ) : (
        /* Inventory Management Workspace */
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          {/* Inventory Search & Filters */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search brand name, generic name, batch #..."
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={invCategory}
                onChange={(e) => setInvCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Tablet">Tablets</option>
                <option value="Capsule">Capsules</option>
                <option value="Syrup">Syrups</option>
                <option value="Injection">Injections</option>
                <option value="Ointment">Ointments</option>
              </select>

              <select
                value={invStatus}
                onChange={(e) => setInvStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Stock Status</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="near_expiry">Near Expiry (30d)</option>
              </select>
            </div>
          </div>

          {/* Inventory Data Table */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto ultra-thin-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider sticky top-0 bg-slate-100">
                    <th className="py-3 px-4">Brand / Generic Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Batch &amp; Expiry</th>
                    <th className="py-3 px-3 text-center">On-Hand Stock</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No inventory items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLow = item.is_low_stock;
                      const isOut = item.is_out_of_stock;
                      const isNearExp = item.is_near_expiry;

                      return (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-xs text-slate-900">
                                {item.brand_name}
                              </span>
                              <span className="text-[11px] text-slate-500 italic">
                                {item.drug_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs font-semibold text-slate-600">
                            {item.category}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col text-xs font-mono">
                              <span className="font-bold text-slate-800">
                                #{item.batch_number || 'N/A'}
                              </span>
                              <span className={`text-[10px] ${isNearExp ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                Exp: {item.expiry_date ? String(item.expiry_date).split('T')[0] : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {item.stock_quantity} Units
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-xs font-mono font-bold text-slate-900">
                            ₹{parseFloat(item.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInventoryItem(item);
                                setShowAdjustModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quick Stock Adjustment Modal */}
      {showAdjustModal && (
        <StockReplenishModal
          item={selectedInventoryItem || {}}
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          onSave={handleSaveStockAdjustment}
          saving={savingItem}
        />
      )}

      {/* 5. Add New Drug Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Inventory Drug</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracip 650"
                    value={newItemForm.brand_name}
                    onChange={(e) => setNewItemForm({ ...newItemForm, brand_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650mg"
                    value={newItemForm.drug_name}
                    onChange={(e) => setNewItemForm({ ...newItemForm, drug_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAT-2026"
                    value={newItemForm.batch_number}
                    onChange={(e) => setNewItemForm({ ...newItemForm, batch_number: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newItemForm.expiry_date}
                    onChange={(e) => setNewItemForm({ ...newItemForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemForm.stock_quantity}
                    onChange={(e) => setNewItemForm({ ...newItemForm, stock_quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.reorder_level}
                    onChange={(e) => setNewItemForm({ ...newItemForm, reorder_level: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newItemForm.unit_price}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {savingItem ? 'Saving...' : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
