import React, { useState, useEffect, useCallback, useMemo } from 'react';
import labService from '../../services/labService';
import LabParameterEntryModal from '../../components/lab/LabParameterEntryModal';
import './LabDashboard.css';

const CATEGORY_LIST = ['All', 'Hematology', 'Biochemistry', 'Serology', 'Clinical Pathology', 'Radiology'];

// Helper function to evaluate if a value is outside the reference range
function evaluateAbnormal(valStr, rangeStr) {
  if (!valStr || !rangeStr) return false;
  const val = parseFloat(valStr.trim());
  if (isNaN(val)) return false;

  const range = rangeStr.trim();

  // Pattern: "13.0 - 17.0" or "70-100"
  if (range.includes('-')) {
    const parts = range.split('-').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return val < parts[0] || val > parts[1];
    }
  }

  // Pattern: "< 200" or "<5.7"
  if (range.startsWith('<')) {
    const limit = parseFloat(range.replace('<', '').trim());
    if (!isNaN(limit)) {
      return val >= limit;
    }
  }

  // Pattern: "> 50"
  if (range.startsWith('>')) {
    const limit = parseFloat(range.replace('>', '').trim());
    if (!isNaN(limit)) {
      return val <= limit;
    }
  }

  return false;
}

export default function LabDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'master'
  const [queue, setQueue] = useState([]);
  const [masterTests, setMasterTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Process Modal State
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [resultRows, setResultRows] = useState([]);
  const [finalizing, setFinalizing] = useState(false);
  const [selectedAddTestId, setSelectedAddTestId] = useState('');

  // Master Test Add/Edit Modal State
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [masterForm, setMasterForm] = useState({
    test_name: '',
    category: 'Biochemistry',
    normal_range: '',
    unit: 'mg/dL',
    price: 0,
  });

  // Fetch Lab Queue
  const fetchQueue = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await labService.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lab queue:', err);
      setErrorMessage('Failed to load pending lab queue.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Fetch Master Tests
  const fetchMasterTests = useCallback(async () => {
    try {
      const data = await labService.listTestMaster();
      setMasterTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load lab master catalog:', err);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchMasterTests();
  }, [fetchQueue, fetchMasterTests]);

  // Open "Process Test" Modal
  const handleOpenProcess = async (visitId) => {
    setSelectedVisitId(visitId);
    setLoadingOrder(true);
    try {
      const details = await labService.getOrderDetails(visitId);
      setOrderDetails(details);

      // Populate initial result rows from prescribed tests or available master tests
      const initialRows = [];
      const prescribed = details.prescribed_tests || [];
      const available = details.available_tests || masterTests || [];

      // 1. If existing results exist, pre-fill them
      if (details.existing_results && details.existing_results.length > 0) {
        details.existing_results.forEach((r) => {
          initialRows.push({
            test_id: r.test_id,
            test_name: r.test_name,
            result_value: r.result_value,
            normal_range: r.normal_range || '',
            unit: r.unit || '',
            is_abnormal: r.is_abnormal || false,
            notes: r.notes || '',
            price: 0,
          });
        });
      } else {
        // 2. Match prescribed test names with catalog
        prescribed.forEach((prescribedName) => {
          const match = available.find(
            (t) => t.test_name.toLowerCase().includes(prescribedName.toLowerCase()) ||
                   prescribedName.toLowerCase().includes(t.test_name.toLowerCase())
          );
          if (match) {
            initialRows.push({
              test_id: match.id,
              test_name: match.test_name,
              result_value: '',
              normal_range: match.normal_range || '',
              unit: match.unit || '',
              is_abnormal: false,
              notes: '',
              price: match.price || 0,
            });
          } else {
            // Unmatched custom investigation: pick first test or generic placeholder
            const fallback = available[0];
            initialRows.push({
              test_id: fallback ? fallback.id : 1,
              test_name: prescribedName,
              result_value: '',
              normal_range: fallback ? fallback.normal_range : '',
              unit: fallback ? fallback.unit : '',
              is_abnormal: false,
              notes: '',
              price: fallback ? fallback.price : 0,
            });
          }
        });

        // If no prescribed test row found, populate default CBC test
        if (initialRows.length === 0 && available.length > 0) {
          const defaultTest = available[0];
          initialRows.push({
            test_id: defaultTest.id,
            test_name: defaultTest.test_name,
            result_value: '',
            normal_range: defaultTest.normal_range || '',
            unit: defaultTest.unit || '',
            is_abnormal: false,
            notes: '',
            price: defaultTest.price || 0,
          });
        }
      }

      setResultRows(initialRows);
    } catch (err) {
      console.error('Failed to open test order:', err);
      alert('Unable to load investigation details for this patient.');
      setSelectedVisitId(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  // Add Test to Current Batch
  const handleAddTestToBatch = (testId) => {
    if (!testId) return;
    const testObj = masterTests.find((t) => t.id === parseInt(testId, 10));
    if (!testObj) return;

    // Avoid duplicate in same batch
    if (resultRows.some((r) => r.test_id === testObj.id)) {
      alert(`${testObj.test_name} is already in the results list.`);
      return;
    }

    setResultRows((prev) => [
      ...prev,
      {
        test_id: testObj.id,
        test_name: testObj.test_name,
        result_value: '',
        normal_range: testObj.normal_range || '',
        unit: testObj.unit || '',
        is_abnormal: false,
        notes: '',
        price: testObj.price || 0,
      },
    ]);
    setSelectedAddTestId('');
  };

  // Update Result Row Value with Smart Red Anomaly Calculation
  const handleResultChange = (index, val) => {
    setResultRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], result_value: val };
      row.is_abnormal = evaluateAbnormal(val, row.normal_range);
      updated[index] = row;
      return updated;
    });
  };

  // Toggle Anomaly Manually
  const handleToggleAbnormal = (index) => {
    setResultRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], is_abnormal: !updated[index].is_abnormal };
      return updated;
    });
  };

  // Remove Row
  const handleRemoveRow = (index) => {
    setResultRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Finalize Results and Send to Doctor
  const handleFinalizeModal = async (payload) => {
    setFinalizing(true);
    try {
      const finalPayload = {
        ...payload,
        visit_id: payload.visit_id || selectedVisitId || orderDetails?.visit_id,
      };

      let res;
      if (finalPayload.order_id) {
        res = await labService.finalizeOrderById(finalPayload.order_id, finalPayload);
      } else {
        res = await labService.finalizeOrder(finalPayload);
      }

      setSuccessMessage(
        `✓ Lab order for '${payload.test_name || 'Investigation'}' finalized and synchronized with Doctor Desk.`
      );
      setSelectedVisitId(null);
      setOrderDetails(null);
      await fetchQueue();
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (err) {
      console.error('Failed to finalize lab order:', err);
      alert(err.response?.data?.detail || 'Failed to finalize lab order.');
    } finally {
      setFinalizing(false);
    }
  };

  // KPI Calculations
  const totalInQueue = queue.length;
  const pendingCount = queue.filter((q) => q.status === 'PENDING').length;
  const inProgressCount = queue.filter((q) => q.status === 'IN_PROGRESS').length;
  const abnormalCountInBatch = resultRows.filter((r) => r.is_abnormal).length;

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return queue;
    const q = searchQuery.toLowerCase().trim();
    return queue.filter(
      (item) =>
        item.patient_name?.toLowerCase().includes(q) ||
        item.patient_id?.toLowerCase().includes(q) ||
        item.visit_number?.toLowerCase().includes(q) ||
        item.doctor_name?.toLowerCase().includes(q)
    );
  }, [queue, searchQuery]);

  // Filtered Master Tests
  const filteredMasterTests = useMemo(() => {
    let list = masterTests;
    if (categoryFilter !== 'All') {
      list = list.filter((t) => t.category?.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.test_name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.normal_range?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [masterTests, categoryFilter, searchQuery]);

  return (
    <div className="lab-dashboard-layout">
      <main className="lab-dashboard-main">
        <div className="lab-content-max">
          {/* 1. Top Header */}
          <div className="lab-header">
            <div className="lab-title-zone">
              <div className="lab-icon-box">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 13v6" />
                  <path d="M12 11v8" />
                  <path d="M15 15v4" />
                </svg>
              </div>
              <div>
                <h1 className="lab-title">Laboratory Dashboard</h1>
                <p className="lab-subtitle">
                  Diagnostic investigation orders, specimen processing, and automated Doctor RX synchronization
                </p>
              </div>
            </div>

            {/* Tab Segmented Control */}
            <div className="flex items-center gap-3">
              <div className="lab-tab-segmented">
                <button
                  type="button"
                  className={`lab-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('queue')}
                  data-testid="tab-lab-queue"
                >
                  <span>Pending Orders Queue</span>
                  <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full">
                    {totalInQueue}
                  </span>
                </button>
                <button
                  type="button"
                  className={`lab-tab-btn ${activeTab === 'master' ? 'active' : ''}`}
                  onClick={() => setActiveTab('master')}
                  data-testid="tab-lab-master"
                >
                  <span>Lab Test Master</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full">
                    {masterTests.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMessage}</span>
              </div>
              <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-xs font-bold flex items-center justify-between shadow-xs">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-700 hover:text-rose-950 font-bold cursor-pointer">✕</button>
            </div>
          )}

          {/* 2. KPI Summary Bar */}
          <div className="lab-kpis-grid">
            <div className="lab-kpi-card kpi-teal">
              <span className="lab-kpi-title">TOTAL INVESTIGATION QUEUE</span>
              <div className="lab-kpi-val text-teal-700">{totalInQueue}</div>
            </div>
            <div className="lab-kpi-card kpi-rose">
              <span className="lab-kpi-title">AWAITING RESULTS</span>
              <div className="lab-kpi-val text-rose-600">{pendingCount}</div>
            </div>
            <div className="lab-kpi-card kpi-blue">
              <span className="lab-kpi-title">IN PROGRESS</span>
              <div className="lab-kpi-val text-blue-700">{inProgressCount}</div>
            </div>
            <div className="lab-kpi-card kpi-amber">
              <span className="lab-kpi-title">CATALOG TEST PROFILES</span>
              <div className="lab-kpi-val text-amber-600">{masterTests.length}</div>
            </div>
          </div>

          {/* 3. Tab Content */}
          {activeTab === 'queue' ? (
            /* TAB 1: PENDING LAB ORDERS QUEUE */
            <div className="lab-panel">
              <div className="lab-panel-header">
                {/* Search Bar */}
                <div className="relative w-80">
                  <input
                    type="text"
                    placeholder="Search Patient Name, ID, Token #, Doctor..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-queue"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    onClick={() => fetchQueue(true)}
                    disabled={refreshing}
                  >
                    <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    <span>{refreshing ? 'Refreshing…' : 'Sync Queue'}</span>
                  </button>
                </div>
              </div>

              <div className="lab-dense-table-wrapper">
                <table className="lab-dense-table">
                  <thead>
                    <tr>
                      <th style={{ width: '46px' }}>S.No</th>
                      <th style={{ width: '100px' }}>Token #</th>
                      <th style={{ width: '120px' }}>Patient ID</th>
                      <th style={{ width: '200px' }}>Patient Name</th>
                      <th style={{ width: '120px' }}>Age / Gender</th>
                      <th style={{ width: '180px' }}>Doctor</th>
                      <th>Prescribed Investigations</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                          Loading pending laboratory investigations…
                        </td>
                      </tr>
                    ) : filteredQueue.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                          No pending investigation orders in the laboratory queue.
                        </td>
                      </tr>
                    ) : (
                      filteredQueue.map((item, idx) => (
                        <tr key={item.visit_id} data-testid={`lab-queue-row-${idx}`}>
                          <td className="text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td>
                            <span className="lab-token-badge">{item.visit_number}</span>
                          </td>
                          <td className="font-mono text-xs text-slate-600 font-semibold">{item.patient_id}</td>
                          <td className="font-bold text-slate-900">{item.patient_name}</td>
                          <td className="text-slate-600 text-xs">{item.age_sex}</td>
                          <td className="text-slate-700 font-medium text-xs">{item.doctor_name}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {item.prescribed_tests.map((tName, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200"
                                >
                                  {tName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {item.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="lab-btn-process"
                              onClick={() => handleOpenProcess(item.visit_id)}
                              data-testid={`btn-process-test-${idx}`}
                            >
                              <span>Process Test</span>
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
          ) : (
            /* TAB 2: LAB TEST MASTER DICTIONARY */
            <div className="lab-panel">
              <div className="lab-panel-header">
                {/* Search */}
                <div className="relative w-80">
                  <input
                    type="text"
                    placeholder="Search Lab Test Name, Category, Range..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    {CATEGORY_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lab-dense-table-wrapper">
                <table className="lab-dense-table">
                  <thead>
                    <tr>
                      <th style={{ width: '46px' }}>S.No</th>
                      <th style={{ width: '260px' }}>Test Name</th>
                      <th style={{ width: '150px' }}>Category</th>
                      <th style={{ width: '180px' }}>Normal Reference Range</th>
                      <th style={{ width: '110px' }}>Unit</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Price (₹)</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMasterTests.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="text-slate-400 font-mono text-xs">{idx + 1}</td>
                        <td className="font-bold text-slate-900">{t.test_name}</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {t.category}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-slate-800 font-semibold">{t.normal_range || '—'}</td>
                        <td className="font-mono text-xs text-slate-600">{t.unit || '—'}</td>
                        <td className="text-right font-mono font-bold text-slate-900">₹{t.price?.toFixed(2)}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. Results Entry Modal (The Core Engine) */}
      <LabParameterEntryModal
        isOpen={Boolean(selectedVisitId && orderDetails)}
        onClose={() => {
          setSelectedVisitId(null);
          setOrderDetails(null);
        }}
        visitId={selectedVisitId}
        orderDetails={orderDetails}
        masterTests={masterTests}
        onFinalize={handleFinalizeModal}
        isFinalizing={finalizing}
      />
    </div>
  );
}
