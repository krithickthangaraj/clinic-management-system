import React, { useState, useEffect, useRef } from 'react';
import { patientService } from '../../services/patientService';
import {
  SearchIcon,
  QueueIcon,
  ClockIcon,
  PhoneIcon,
  CloseIcon,
  BarcodeIcon,
} from '../common/MedicalIcons';

const STATUS_LABELS = {
  registered: 'Vitals Pending',
  vitals_done: 'In Queue',
  in_consultation: 'With Doctor',
  consulted: 'Seen',
  completed: 'Done',
};

export default function PatientSearch({
  onSelectPatient,
  selectedPatientId,
  todayVisits = [],
  todayFilter = 'in_queue',
  onFilterChange = () => {},
  loadingToday = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await patientService.search(q);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle hardware barcode scanner inputs (scanners usually append Enter key)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleSelect(searchResults[0]);
    }
  };

  const handleSelect = (patient) => {
    onSelectPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
  };

  const PENDING = ['registered'];
  const IN_QUEUE = ['vitals_done'];
  const ALREADY_SEEN = ['in_consultation', 'consulted', 'completed'];

  const countInQueue = todayVisits.filter((v) => IN_QUEUE.includes(v.status)).length;
  const countPending = todayVisits.filter((v) => PENDING.includes(v.status)).length;
  const countAlreadySeen = todayVisits.filter((v) => ALREADY_SEEN.includes(v.status)).length;

  const filteredVisits = todayVisits.filter((v) => {
    if (todayFilter === 'all') return true;
    if (todayFilter === 'in_queue') return IN_QUEUE.includes(v.status);
    if (todayFilter === 'pending') return PENDING.includes(v.status);
    if (todayFilter === 'already_seen') return ALREADY_SEEN.includes(v.status);
    return true;
  });

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <aside className="registration-sidebar">
      {/* Search Section */}
      <div className="search-box-container">
        <label htmlFor="patient-global-search" className="search-label-bar">
          <SearchIcon className="search-icon-svg" />
          <input
            id="patient-global-search"
            ref={searchInputRef}
            type="text"
            className="patient-search-input"
            placeholder="Scan Barcode / Search ID, Name, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                searchInputRef.current?.focus();
              }}
              title="Clear search"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </label>

        {isSearching && <div className="search-loading-hint">Searching patient records…</div>}

        {/* Live Search Dropdown */}
        {searchResults.length > 0 && (
          <div className="search-dropdown-menu">
            <div className="search-results-header">
              <span>Matching Patients</span>
              <span className="results-count-pill">{searchResults.length}</span>
            </div>
            <ul className="search-results-list">
              {searchResults.map((patient) => (
                <li
                  key={patient.id}
                  className={`search-result-row ${selectedPatientId === patient.id ? 'active' : ''}`}
                  onClick={() => handleSelect(patient)}
                >
                  <div className="result-main">
                    <span className="result-id-chip">{patient.patient_id || `#${patient.id}`}</span>
                    <strong className="result-name">{patient.full_name || patient.name}</strong>
                  </div>
                  <div className="result-sub">
                    <span className="result-phone">
                      <PhoneIcon className="w-3 h-3 inline mr-1 opacity-70" />
                      {patient.phone_number || patient.phone}
                    </span>
                    {patient.gender && <span className="result-meta">• {patient.gender}</span>}
                    {patient.barcode && (
                      <span className="result-barcode-tag">
                        <BarcodeIcon className="w-3 h-3 inline mr-1" />
                        {patient.barcode}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Today's Queue Card */}
      <div className="today-queue-card">
        <div className="today-queue-header">
          <h3 className="today-heading">
            <QueueIcon className="today-heading-icon" /> Today&apos;s Queue
          </h3>
          <span className="today-badge-total">{todayVisits.length} Total</span>
        </div>

        {/* Status Filter Tabs */}
        <div className="today-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={todayFilter === 'in_queue'}
            className={`today-filter-pill ${todayFilter === 'in_queue' ? 'active' : ''}`}
            onClick={() => onFilterChange('in_queue')}
          >
            Queue <span className="pill-count">({countInQueue})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={todayFilter === 'pending'}
            className={`today-filter-pill ${todayFilter === 'pending' ? 'active' : ''}`}
            onClick={() => onFilterChange('pending')}
          >
            Pending <span className="pill-count">({countPending})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={todayFilter === 'already_seen'}
            className={`today-filter-pill ${todayFilter === 'already_seen' ? 'active' : ''}`}
            onClick={() => onFilterChange('already_seen')}
          >
            Seen <span className="pill-count">({countAlreadySeen})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={todayFilter === 'all'}
            className={`today-filter-pill ${todayFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
        </div>

        {/* Patient Visit Queue List */}
        <div className="today-queue-body">
          {loadingToday && filteredVisits.length === 0 ? (
            <div className="today-loading-state">Loading queue…</div>
          ) : filteredVisits.length === 0 ? (
            <div className="today-empty-state">No visits found in this tab.</div>
          ) : (
            <ul className="today-visits-list">
              {filteredVisits.map((visit) => (
                <li
                  key={visit.id}
                  className={`today-visit-item ${selectedPatientId === visit.patient_id ? 'selected' : ''}`}
                  onClick={() =>
                    onSelectPatient({
                      id: visit.patient_id,
                      name: visit.patient_name || `#${visit.patient_id}`,
                      visit_id: visit.id,
                    })
                  }
                >
                  <div className="visit-item-top">
                    <span className="visit-patient-name">
                      {visit.patient_name || `Patient #${visit.patient_id}`}
                    </span>
                    <span className={`visit-status-badge status-${visit.status}`}>
                      {STATUS_LABELS[visit.status] || visit.status}
                    </span>
                  </div>
                  <div className="visit-item-bottom">
                    <span className="visit-number-tag">{visit.visit_number}</span>
                    <span className="visit-time-tag">
                      <ClockIcon className="w-3 h-3 inline mr-1" />
                      {formatTime(visit.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
