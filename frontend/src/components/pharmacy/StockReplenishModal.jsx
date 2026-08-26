import React, { useState } from 'react';

/**
 * StockReplenishModal - Quick Stock Adjustment Modal
 */
export default function StockReplenishModal({
  item = {},
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  saving = false,
}) {
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' | 'deduct' | 'set'
  const [quantity, setQuantity] = useState(50);
  const [reason, setReason] = useState('Stock Receipt / GRN');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      item_id: item.id || item.drug_id,
      adjustment_type: adjustmentType,
      quantity: parseInt(quantity, 10) || 0,
      reason,
      notes,
    });
  };

  const brandName = item.brand_name || item.drug_name || 'Item';

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stock Adjustment</h3>
            <p className="text-xs text-slate-500 font-semibold">{brandName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'add', label: '+ Add Stock' },
                { id: 'deduct', label: '- Deduct' },
                { id: 'set', label: '= Set Value' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAdjustmentType(t.id)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    adjustmentType === t.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Adjustment
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none font-medium"
            >
              <option value="Stock Receipt / GRN">Stock Receipt / GRN</option>
              <option value="Breakage/Damage">Breakage / Damage</option>
              <option value="Physical Audit Count">Physical Audit Count</option>
              <option value="Expired Batch Removal">Expired Batch Removal</option>
              <option value="Returned Medicine">Returned Medicine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Reference No.
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #INV-4902"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Updating...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
