import React from 'react';
import BatchSelectorDropdown from './BatchSelectorDropdown';
import { MonospaceDataTag, ClinicalBadge } from '../ui';

/**
 * Helper to compute unit counts from frequency regimen & duration
 */
export function computeDispenseUnits(freq = '1-0-1', days = 5, fallbackQty = null) {
  if (fallbackQty && fallbackQty > 0) return fallbackQty;
  if (!freq) return days || 10;

  const fStr = String(freq).trim();
  if (fStr.toLowerCase().includes('sos')) return 5;

  const parts = fStr.split('-').map((p) => parseFloat(p.trim()) || 0);
  const dailyTotal = parts.reduce((acc, curr) => acc + curr, 0);

  if (dailyTotal > 0 && days > 0) {
    return Math.ceil(dailyTotal * days);
  }
  return days > 0 ? days * 2 : 10;
}

/**
 * MedicationDispenseRow - Interactive Reconciliation Row with Multi-Batch & Partial Dispense
 */
export default function MedicationDispenseRow({
  item = {},
  index = 0,
  isVerified = false,
  onToggleVerify = () => {},
  onSelectBatch = () => {},
  onQuantityChange = () => {},
  selectedBatchId = null,
  currentQty = null,
}) {
  const brandName = item.brand_name || item.drug_name || 'Unnamed Medication';
  const genericName = item.drug_name || item.name || '';
  const dosage = item.dosage || '';
  const frequency = item.frequency || '1-0-1';
  const duration = item.duration_days || item.days || 5;
  const timing = item.instructions || item.timing_notes || item.timing || 'After Food';

  const prescribedUnits = item.prescribed_quantity || item.quantity || computeDispenseUnits(frequency, duration);
  const dispensedUnits = currentQty !== null && currentQty !== undefined ? currentQty : prescribedUnits;

  // Resolve active batch details
  const availableBatches = Array.isArray(item.available_batches) ? item.available_batches : [];
  const activeBatch =
    availableBatches.find((b) => b.batch_id === selectedBatchId || b.id === selectedBatchId) ||
    availableBatches.find((b) => b.is_fefo_recommended) ||
    availableBatches[0] ||
    null;

  const currentBatchNumber = activeBatch?.batch_number || item.batch_number || 'GEN-2026-001';
  const currentBatchStock = activeBatch ? activeBatch.stock_quantity : (item.available_stock || 100);
  const unitPrice = parseFloat(activeBatch?.unit_price || item.unit_price || 5.0);
  const lineSubtotal = (dispensedUnits * unitPrice).toFixed(2);

  const isPartial = dispensedUnits < prescribedUnits;
  const isOutOfStock = currentBatchStock <= 0;
  const isInsufficientStock = currentBatchStock < dispensedUnits;

  return (
    <div
      className={`p-3.5 transition-all select-none flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-l-4 ${
        isVerified
          ? 'bg-teal-50/40 border-l-teal-600'
          : isOutOfStock || isInsufficientStock
          ? 'bg-rose-50/40 border-l-rose-500'
          : isPartial
          ? 'bg-amber-50/30 border-l-amber-500'
          : 'bg-white hover:bg-slate-50/80 border-l-transparent'
      }`}
      data-testid="medication-dispense-row"
    >
      {/* 1. Left: Verification Checkbox + S.No + Medication Details */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <label className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center cursor-pointer mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={isVerified}
            onChange={onToggleVerify}
            className="w-5 h-5 rounded-md text-teal-700 focus:ring-teal-500 border-slate-300 transition-all cursor-pointer accent-teal-700"
          />
        </label>

        <span className="font-mono font-bold text-xs text-slate-400 mt-1 shrink-0 w-5">
          {index + 1}
        </span>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-black text-xs sm:text-sm text-slate-900 tracking-tight">
              {brandName}
            </h4>
            {dosage && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                {dosage}
              </span>
            )}
            {isPartial && (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-600/30">
                Partial: {dispensedUnits} / {prescribedUnits} Tabs
              </span>
            )}
          </div>

          {genericName && genericName !== brandName && (
            <span className="text-[11px] text-slate-500 italic mt-0.5 truncate">
              {genericName}
            </span>
          )}

          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-teal-100/70 text-teal-800 font-mono font-bold text-[10px]">
              {frequency}
            </span>
            <span>•</span>
            <span>{duration} Days</span>
            <span>•</span>
            <span className="text-slate-500">{timing}</span>
          </div>
        </div>
      </div>

      {/* 2. Middle & Right: Batch Selector + Quantity Stepper + Pricing */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap pl-11 md:pl-0">
        {/* Quantity Stepper */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <input
              type="number"
              min="1"
              max={currentBatchStock > 0 ? currentBatchStock : prescribedUnits}
              value={dispensedUnits}
              onChange={(e) => onQuantityChange(parseInt(e.target.value, 10) || 1)}
              className="w-14 h-7 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500"
              data-testid="quantity-input"
            />
            <span className="text-[10px] font-bold text-slate-400 pr-1.5">
              Tabs
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">
            Rx: {prescribedUnits} Tabs
          </span>
        </div>

        {/* FEFO Batch Picker */}
        <div className="flex flex-col items-end">
          <BatchSelectorDropdown
            batches={availableBatches}
            selectedBatchId={selectedBatchId || activeBatch?.batch_id || activeBatch?.id}
            fallbackBatchNumber={currentBatchNumber}
            fallbackStock={currentBatchStock}
            fallbackPrice={unitPrice}
            onSelectBatch={onSelectBatch}
          />
          {isInsufficientStock && (
            <span className="text-[10px] font-bold text-rose-600 mt-0.5">
              Insufficient batch stock ({currentBatchStock} left)
            </span>
          )}
        </div>

        {/* Unit Price & Line Subtotal */}
        <div className="text-right min-w-[70px]">
          <span className="text-xs font-mono font-black text-slate-900 block">
            ₹{lineSubtotal}
          </span>
          <span className="text-[10px] font-mono text-slate-400 block">
            @ ₹{unitPrice.toFixed(2)}/u
          </span>
        </div>
      </div>
    </div>
  );
}
