import React, { useState } from 'react';
import DispenseQueueCard from './DispenseQueueCard';

/**
 * DispenseQueueList - Left Pane (380px fixed width) Search & Real-Time Queue Feed
 */
export default function DispenseQueueList({
  queue = [],
  selectedVisitId = null,
  onSelectVisit = () => {},
  onRefresh = () => {},
  refreshing = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'DISPENSED'

  // Filter Queue based on Search & Status
  const filteredQueue = queue.filter((item) => {
    // 1. Status check
    const pharmStatus = String(item.pharmacy_status || '').toLowerCase();
    const visitStatus = String(item.status || '').toLowerCase();
    const isDispensed = pharmStatus === 'dispensed' || visitStatus === 'dispensed';

    if (statusFilter === 'PENDING' && isDispensed) return false;
    if (statusFilter === 'DISPENSED' && !isDispensed) return false;

    // 2. Search query check
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = String(item.patient_name || '').toLowerCase().includes(q);
    const idMatch = String(item.patient_id || item.patient_uhid || '').toLowerCase().includes(q);
    const tokenMatch = String(item.queue_number || item.token_number || item.visit_id || '').includes(q);

    return nameMatch || idMatch || tokenMatch;
  });

  return (
    <div className="w-full lg:w-[380px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* 1. Header & Live Counter */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Dispense Queue
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
            {filteredQueue.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          title="Refresh Queue"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* 2. Search & Segmented Filter Control */}
      <div className="p-3 space-y-2.5 border-b border-slate-200 bg-white">
        {/* Search Bar */}
        <div className="relative">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            placeholder="Search patient, token, UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-400"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs p-0.5 cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* 3-Pill Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'PENDING', label: 'Pending' },
            { id: 'ALL', label: 'All' },
            { id: 'DISPENSED', label: 'Completed' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer select-none text-center ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Scrollable List of Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 ultra-thin-scrollbar bg-slate-50/40">
        {filteredQueue.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 space-y-2">
            <svg
              className="w-10 h-10 mx-auto text-slate-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <p className="text-xs font-semibold text-slate-600">No prescriptions found</p>
            <p className="text-[11px] text-slate-400">
              {searchQuery ? 'Try adjusting your search query' : 'Queue is currently clear'}
            </p>
          </div>
        ) : (
          filteredQueue.map((item) => (
            <DispenseQueueCard
              key={item.visit_id || item.prescription_id}
              item={item}
              isSelected={selectedVisitId === (item.visit_id || item.prescription_id)}
              onSelect={onSelectVisit}
            />
          ))
        )}
      </div>
    </div>
  );
}
