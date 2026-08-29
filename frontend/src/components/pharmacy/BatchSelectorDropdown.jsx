import React, { useState, useRef, useEffect } from 'react';
import { ClinicalBadge } from '../ui';

/**
 * BatchSelectorDropdown - FEFO-Aware Multi-Batch Picker
 * Features:
 * - Displays active batch with expiry countdown & stock balance
 * - Highlights the earliest non-expired batch with 'FEFO Recommended' badge
 * - Allows pharmacists to seamlessly override batches with live price updating
 */
export default function BatchSelectorDropdown({
  batches = [],
  selectedBatchId = null,
  fallbackBatchNumber = 'GEN-2026-001',
  fallbackStock = 100,
  fallbackPrice = 5.0,
  onSelectBatch = () => {},
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Find currently selected batch object
  const currentBatch =
    batches.find((b) => b.batch_id === selectedBatchId || b.id === selectedBatchId) ||
    batches.find((b) => b.is_fefo_recommended) ||
    batches[0] ||
    null;

  const currentBatchNo = currentBatch?.batch_number || fallbackBatchNumber;
  const currentStock = currentBatch ? currentBatch.stock_quantity : fallbackStock;
  const currentExpiry = currentBatch?.expiry_date_str || (currentBatch?.expiry_date ? String(currentBatch.expiry_date).slice(0, 7) : '—');
  const isFefo = Boolean(currentBatch?.is_fefo_recommended);

  if (batches.length <= 1 && !currentBatch) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
        <span className="font-bold">#{currentBatchNo}</span>
        <span className="text-slate-400">•</span>
        <span className="text-[11px] text-emerald-700 font-semibold">{currentStock} in stock</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left w-full max-w-[230px]" ref={dropdownRef}>
      {/* 1. Selector Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white hover:bg-slate-50/80 border rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 shadow-2xs transition-all cursor-pointer ${
          isOpen
            ? 'border-teal-500 ring-2 ring-teal-500/20'
            : isFefo
            ? 'border-emerald-300 hover:border-emerald-400'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        data-testid="batch-trigger"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono font-bold text-slate-900 truncate">
            #{currentBatchNo}
          </span>
          {isFefo ? (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/30">
              FEFO
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-slate-500 font-medium truncate">
              {currentExpiry}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`font-mono text-[11px] font-extrabold ${
              currentStock <= 0
                ? 'text-rose-600'
                : currentStock < 15
                ? 'text-amber-600'
                : 'text-emerald-700'
            }`}
          >
            {currentStock}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-teal-600' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* 2. Popover Batch Options Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 px-1 z-50 animate-fadeIn space-y-1">
          <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
            <span>Available Batches ({batches.length})</span>
            <span>FEFO Sorting</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
            {batches.map((batch) => {
              const bId = batch.batch_id || batch.id;
              const isSelected = (currentBatch?.batch_id || currentBatch?.id) === bId;
              const isBatchFefo = Boolean(batch.is_fefo_recommended);
              const months = batch.months_until_expiry;

              return (
                <div
                  key={bId || batch.batch_number}
                  onClick={() => {
                    onSelectBatch(batch);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-teal-50/80 border border-teal-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        #{batch.batch_number}
                      </span>
                      {isBatchFefo && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/30">
                          FEFO Recommended
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <span>Exp: {batch.expiry_date_str || String(batch.expiry_date || '—').slice(0, 7)}</span>
                      {months !== null && months !== undefined && (
                        <span className="text-slate-400">({months} mos)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`block font-mono text-xs font-extrabold ${
                        batch.stock_quantity <= 0
                          ? 'text-rose-600'
                          : batch.stock_quantity < 15
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {batch.stock_quantity} in stock
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ₹{parseFloat(batch.unit_price || 0).toFixed(2)}/u
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
