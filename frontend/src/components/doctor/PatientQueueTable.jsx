import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { visitService } from '../../services/visitService';
import WaitingTimeBadge from './WaitingTimeBadge';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'routine', label: 'Routine' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'follow-up', label: 'Follow-up' },
];

export function getCategoryBadgeClass(cat) {
  const c = String(cat || '').toLowerCase();
  if (c.includes('follow')) return 'category-badge-followup';
  if (c.includes('emergen')) return 'category-badge-emergency';
  if (c.includes('review')) return 'category-badge-review';
  return 'category-badge-opd';
}

export default function PatientQueueTable({
  patients = [],
  loading = false,
  activeKpiFilter = 'all',
  selectedCategory = 'all',
  onCategoryChange = () => {},
  categoryCounts = {},
  onResetFilters = () => {},
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Comprehensive multi-criteria filtering: KPI Filter + Segmented Category Filter + Search
  const filteredPatients = useMemo(() => {
    let list = Array.isArray(patients) ? patients : [];

    // 1. Filter by KPI status (from DashboardKPIs cards)
    if (activeKpiFilter === 'waiting') {
      list = list.filter((p) =>
        ['vitals_done', 'registered', 'in_consultation'].includes(String(p.status).toLowerCase())
      );
    } else if (activeKpiFilter === 'followup') {
      list = list.filter((p) =>
        String(p.category || '').toLowerCase().includes('follow')
      );
    } else if (activeKpiFilter === 'reports_pending') {
      list = list.filter((p) =>
        String(p.status || '').toLowerCase().includes('report') ||
        String(p.remarks || '').toLowerCase().includes('lab')
      );
    } else if (activeKpiFilter === 'completed') {
      list = list.filter((p) =>
        ['consulted', 'completed'].includes(String(p.status).toLowerCase())
      );
    }

    // 2. Filter by Segmented Category Control
    if (selectedCategory !== 'all') {
      const catKey = selectedCategory.toLowerCase();
      if (catKey === 'routine') {
        list = list.filter((p) => {
          const c = String(p.category || '').toLowerCase();
          return c.includes('opd') || c.includes('routine') || c.includes('general') || c.includes('review');
        });
      } else if (catKey === 'emergency') {
        list = list.filter((p) =>
          String(p.category || '').toLowerCase().includes('emergen')
        );
      } else if (catKey === 'follow-up' || catKey === 'followup') {
        list = list.filter((p) =>
          String(p.category || '').toLowerCase().includes('follow')
        );
      }
    }

    // 3. Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.patient_name?.toLowerCase().includes(q) ||
          p.patient_id?.toLowerCase().includes(q) ||
          p.remarks?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [patients, activeKpiFilter, selectedCategory, searchTerm]);

  // Automated Workflow: Update patient visit status to 'in_consultation' before routing to Doctor Desk
  const handleRowClick = async (visitId) => {
    if (visitId) {
      try {
        await visitService.update(visitId, { status: 'in_consultation' });
      } catch (err) {
        console.warn('Status auto-update background notice:', err);
      }
      navigate(`/doctor/consultation/${visitId}`);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    onResetFilters();
  };

  const hasActiveFilters = selectedCategory !== 'all' || activeKpiFilter !== 'all' || Boolean(searchTerm);

  return (
    <section className="patient-queue-section" aria-label="Patient Queue Table">
      {/* Table Toolbar: Queue Title (Left) + Segmented Category Filters & Search (Right) */}
      <div className="queue-table-toolbar">
        <div className="toolbar-left">
          <h2 className="section-header-title mb-0">
            Patient Consultation Queue
            <span className="queue-count-pill" data-testid="queue-count-pill">
              {filteredPatients.length} Patients
            </span>
          </h2>
        </div>

        <div className="toolbar-right">
          {/* Segmented Category Filter (Near Patient Queue, Left of Search) */}
          <div className="segmented-category-control" role="tablist" aria-label="Patient Category Filter">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              const count = categoryCounts[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`segmented-tab-btn ${isSelected ? 'is-active' : ''}`}
                  onClick={() => onCategoryChange(tab.id)}
                  data-testid={`category-tab-${tab.id}`}
                >
                  <span className="tab-btn-text">{tab.label}</span>
                  {count !== undefined && count !== null && (
                    <span className={`tab-count-tag ${isSelected ? 'count-active' : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="queue-search-wrapper">
            <svg className="queue-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="queue-search-input"
              placeholder="Search queue by Name, ID, or Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive-wrapper">
        <table className="dense-patient-table" data-testid="patient-queue-table">
          <thead>
            <tr className="sticky-table-header">
              <th className="th-que-no">QUE. NO.</th>
              <th className="th-name">NAME</th>
              <th className="th-age-sex">AGE / SEX</th>
              <th className="th-patient-id">PATIENT ID</th>
              <th className="th-category">CATEGORY</th>
              <th className="th-waiting-time">WAITING TIME</th>
              <th className="th-remarks">REMARKS</th>
              <th className="th-action text-right">ACTION</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Skeleton Loader Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row" data-testid="skeleton-row">
                  <td><div className="skeleton-cell w-8" /></td>
                  <td><div className="skeleton-cell w-36" /></td>
                  <td><div className="skeleton-cell w-20" /></td>
                  <td><div className="skeleton-cell w-24" /></td>
                  <td><div className="skeleton-cell w-16" /></td>
                  <td><div className="skeleton-cell w-20" /></td>
                  <td><div className="skeleton-cell w-48" /></td>
                  <td><div className="skeleton-cell w-16 ml-auto" /></td>
                </tr>
              ))
            ) : filteredPatients.length === 0 ? (
              // Enhanced Empty State with "Clear Filters" button
              <tr className="empty-state-row" data-testid="empty-queue-row">
                <td colSpan={8}>
                  <div className="empty-queue-container">
                    <div className="empty-icon-circle">
                      <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="17" y1="11" x2="23" y2="11" />
                      </svg>
                    </div>
                    <h3 className="empty-queue-heading">
                      {selectedCategory !== 'all'
                        ? `No ${selectedCategory.toUpperCase()} Patients Found`
                        : 'No Patients in Queue'}
                    </h3>
                    <p className="empty-queue-text">
                      {searchTerm
                        ? `No matching records found for "${searchTerm}".`
                        : selectedCategory !== 'all'
                        ? `There are currently no patients categorized under "${selectedCategory}".`
                        : 'All scheduled patients have been attended.'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="btn-clear-filters"
                        onClick={handleClearAllFilters}
                        title="Reset all filters and view all patients"
                      >
                        <svg className="w-3.5 h-3.5 mr-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                        <span>Clear Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // High-Density Data Rows
              filteredPatients.map((patient) => {
                const catClass = getCategoryBadgeClass(patient.category);

                return (
                  <tr
                    key={patient.visit_id}
                    className="patient-data-row"
                    data-testid={`queue-row-${patient.visit_id}`}
                    onClick={() => handleRowClick(patient.visit_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleRowClick(patient.visit_id)}
                  >
                    {/* 1. Queue No */}
                    <td className="td-que-no font-mono font-bold">
                      <span className="queue-number-badge">#{patient.queue_no}</span>
                    </td>

                    {/* 2. Patient Name */}
                    <td className="td-name font-semibold text-slate-900">
                      <div className="patient-name-cell">
                        <span>{patient.patient_name}</span>
                        {patient.status === 'in_consultation' && (
                          <span className="live-pulse-badge">With Doctor</span>
                        )}
                      </div>
                    </td>

                    {/* 3. Age / Sex */}
                    <td className="td-age-sex text-slate-700 font-medium">
                      {patient.age_sex}
                    </td>

                    {/* 4. Patient ID */}
                    <td className="td-patient-id">
                      <span className="patient-id-code font-mono">
                        {patient.patient_id}
                      </span>
                    </td>

                    {/* 5. Category */}
                    <td className="td-category">
                      <span className={`category-pill ${catClass}`}>
                        {patient.category || 'OPD'}
                      </span>
                    </td>

                    {/* 6. Standardized Waiting Time Badge */}
                    <td className="td-waiting-time">
                      <WaitingTimeBadge
                        minutes={patient.waiting_minutes}
                        timeString={patient.waiting_time}
                        status={patient.status}
                      />
                    </td>

                    {/* 7. Remarks */}
                    <td className="td-remarks text-slate-600">
                      <span className="remarks-truncate" title={patient.remarks || 'No remarks'}>
                        {patient.remarks || '—'}
                      </span>
                    </td>

                    {/* 8. Action Button */}
                    <td className="td-action text-right">
                      <button
                        type="button"
                        className="btn-consult-table"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(patient.visit_id);
                        }}
                        title="Open Consultation Desk"
                      >
                        <span>Consult</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
