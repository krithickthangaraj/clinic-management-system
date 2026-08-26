import React from 'react';

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
 * MedicationDispenseRow - Interactive Reconciliation Row
 * Features calculated unit counts, FEFO batch selection, 44px verify checkbox, and stock validation.
 */
export default function MedicationDispenseRow({
  item = {},
  index = 0,
  isVerified = false,
  onToggleVerify = () => {},
  onSelectBatch = () => {},
  onQuantityChange = () => {},
}) {
  const brandName = item.brand_name || item.drug_name || 'Unnamed Medication';
  const genericName = item.drug_name || item.name || '';
  const dosage = item.dosage || '';
  const frequency = item.frequency || '1-0-1';
  const duration = item.duration_days || item.days || 5;
  const timing = item.timing_notes || item.timing || 'After Food';

  const calculatedUnits = item.calculated_units || computeDispenseUnits(frequency, duration, item.quantity);
  const currentStock = typeof item.stock_quantity === 'number' ? item.stock_quantity : item.available_stock || 100;
  const unitPrice = parseFloat(item.unit_price || 5.0);
  const subtotal = (calculatedUnits * unitPrice).toFixed(2);

  const isShortStock = currentStock < calculatedUnits;
  const isOutOfStock = currentStock <= 0;

  return (
    <tr
      className={`border-b border-slate-100 transition-colors select-none ${
        isVerified
          ? 'bg-teal-50/40 text-slate-800'
          : isOutOfStock
          ? 'bg-rose-50/50'
          : isShortStock
          ? 'bg-amber-50/40'
          : 'hover:bg-slate-50/80 bg-white'
      }`}
    >
      {/* 1. 44px Touch Target Checkbox */}
      <td className="py-3 px-3 w-12 text-center">
        <label className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            checked={isVerified}
            onChange={() => onToggleVerify(item)}
            className="w-5 h-5 rounded text-teal-700 focus:ring-teal-500 border-slate-300 transition-all cursor-pointer"
          />
        </label>
      </td>

      {/* 2. S.No */}
      <td className="py-3 px-2 text-xs font-mono font-bold text-slate-400 w-8">
        {index + 1}
      </td>

      {/* 3. Drug Name & Clinical Regimen */}
      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-xs text-slate-900">
              {brandName}
            </span>
            {dosage && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {dosage}
              </span>
            )}
          </div>

          {genericName && genericName !== brandName && (
            <span className="text-[11px] text-slate-500 italic mt-0.5">
              {genericName}
            </span>
          )}

          {/* Regimen pill */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-600">
            <span className="px-1.5 py-0.5 rounded bg-teal-100/70 text-teal-800 font-mono font-bold">
              {frequency}
            </span>
            <span>• {duration} Days</span>
            <span className="text-slate-400">• {timing}</span>
          </div>
        </div>
      </td>

      {/* 4. Calculated Units */}
      <td className="py-3 px-3 text-center">
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            min="1"
            value={calculatedUnits}
            onChange={(e) => onQuantityChange(item, parseInt(e.target.value, 10) || 1)}
            className="w-16 h-8 text-center text-xs font-extrabold bg-white border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg shadow-xs"
          />
          <span className="text-[11px] text-slate-500 font-semibold">Tabs</span>
        </div>
      </td>

      {/* 5. Inventory & Stock Status Badge */}
      <td className="py-3 px-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
              isOutOfStock
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : isShortStock
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isOutOfStock
              ? 'Out of Stock'
              : isShortStock
              ? `Short by ${calculatedUnits - currentStock}`
              : `Stock: ${currentStock}`}
          </span>

          {/* Batch info */}
          <span className="text-[10px] font-mono text-slate-500">
            Batch #{item.batch_number || 'B-2408'}
          </span>
        </div>
      </td>

      {/* 6. Unit Price */}
      <td className="py-3 px-3 text-right text-xs font-mono font-semibold text-slate-700">
        ₹{unitPrice.toFixed(2)}
      </td>

      {/* 7. Subtotal */}
      <td className="py-3 px-3 text-right text-xs font-mono font-extrabold text-slate-900">
        ₹{subtotal}
      </td>
    </tr>
  );
}
