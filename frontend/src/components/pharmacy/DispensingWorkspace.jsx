import React, { useState } from 'react';
import MedicationDispenseRow from './MedicationDispenseRow';
import { getDailyTokenNumber, formatDoctorDisplayName } from '../../utils/formatters';

/**
 * DispensingWorkspace - Right Pane (Flex-1) Master Dispensing & Stock Reconciliation Workspace
 */
export default function DispensingWorkspace({
  prescriptionDetails = null,
  loading = false,
  onDispense = () => {},
  isDispensing = false,
  onOpenStockReplenish = () => {},
}) {
  const [verifiedIds, setVerifiedIds] = useState(new Set());
  const [quantities, setQuantities] = useState({});
  const [paymentMode, setPaymentMode] = useState('Cash');

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-slate-500">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Loading Prescription &amp; Matching Pharmacy Inventory...
        </p>
      </div>
    );
  }

  if (!prescriptionDetails) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <h3 className="text-base font-extrabold text-slate-800">
          No Prescription Selected
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select a patient prescription from the left queue to verify inventory, calculate unit counts, and complete dispensing.
        </p>
      </div>
    );
  }

  const patient = prescriptionDetails.patient || prescriptionDetails;
  const patientName = patient.patient_name || patient.name || 'Patient';
  const uhid = patient.patient_id || patient.patient_uhid || 'UHID-N/A';
  const ageSex = patient.age_sex || `${patient.age || '—'} Y / ${patient.gender || '—'}`;
  const doctorName = formatDoctorDisplayName(prescriptionDetails.consultant_assigned || prescriptionDetails.doctor_name);
  const tokenNo = getDailyTokenNumber(prescriptionDetails);
  const allergies = Array.isArray(patient.allergies) ? patient.allergies : [];

  const items = Array.isArray(prescriptionDetails.medicines)
    ? prescriptionDetails.medicines
    : Array.isArray(prescriptionDetails.matched_medicines)
    ? prescriptionDetails.matched_medicines
    : Array.isArray(prescriptionDetails.items)
    ? prescriptionDetails.items
    : [];

  // Toggle verification for a row
  const toggleVerify = (item) => {
    const id = item.id || item.drug_id || item.prescription_item_id || item.drug_name;
    const next = new Set(verifiedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setVerifiedIds(next);
  };

  // Select all / verify all
  const verifyAll = () => {
    if (verifiedIds.size === items.length) {
      setVerifiedIds(new Set());
    } else {
      const all = new Set(
        items.map((i) => i.id || i.drug_id || i.prescription_item_id || i.drug_name)
      );
      setVerifiedIds(all);
    }
  };

  // Quantity updates
  const handleQtyChange = (item, newQty) => {
    const id = item.id || item.drug_id || item.prescription_item_id || item.drug_name;
    setQuantities((prev) => ({ ...prev, [id]: newQty }));
  };

  // Compute grand total
  const grandTotal = items.reduce((acc, curr) => {
    const id = curr.id || curr.drug_id || curr.prescription_item_id || curr.drug_name;
    const qty = quantities[id] !== undefined ? quantities[id] : curr.calculated_units || curr.quantity || 10;
    const price = parseFloat(curr.unit_price || 5.0);
    return acc + qty * price;
  }, 0);

  const allVerified = items.length > 0 && verifiedIds.size === items.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. Patient Clinical Banner */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-teal-600 font-extrabold text-white flex items-center justify-center text-sm shadow-inner shrink-0">
            {patientName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                {patientName}
              </h2>
              <span className="px-2 py-0.5 rounded font-mono font-extrabold text-xs bg-teal-800 text-teal-100 border border-teal-600">
                Token #{tokenNo}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 flex-wrap">
              <span>{ageSex}</span>
              <span>•</span>
              <span className="font-mono text-teal-300">{uhid}</span>
              <span>•</span>
              <span>Dr. {doctorName.replace(/^Dr\.?\s*/i, '')}</span>
            </div>
          </div>
        </div>

        {/* High-Visibility Allergy Flag */}
        {allergies.length > 0 ? (
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-bold flex items-center gap-2 shrink-0 animate-pulse">
            <span className="text-rose-400">⚠️ Allergy:</span>
            <span>{allergies.join(', ')}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>No Known Drug Allergies</span>
          </div>
        )}
      </div>

      {/* 2. Dispense Verification Table (Scrollable Body) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ultra-thin-scrollbar">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Prescribed Medications ({items.length})
              </span>
              <span className="text-xs text-slate-500">
                ({verifiedIds.size} of {items.length} verified)
              </span>
            </div>

            <button
              type="button"
              onClick={verifyAll}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              {verifiedIds.size === items.length ? 'Uncheck All' : 'Verify All Items'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Verify</th>
                  <th className="py-2.5 px-2 w-8">#</th>
                  <th className="py-2.5 px-3">Medication &amp; Clinical Regimen</th>
                  <th className="py-2.5 px-3 text-center">Units To Dispense</th>
                  <th className="py-2.5 px-3 text-center">Stock &amp; Batch</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No medication records available for this prescription.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const id = item.id || item.drug_id || item.prescription_item_id || item.drug_name;
                    return (
                      <MedicationDispenseRow
                        key={id || idx}
                        item={{
                          ...item,
                          calculated_units: quantities[id] !== undefined ? quantities[id] : item.calculated_units,
                        }}
                        index={idx}
                        isVerified={verifiedIds.has(id)}
                        onToggleVerify={toggleVerify}
                        onQuantityChange={handleQtyChange}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Fixed Summary Footer Action Bar */}
      <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Left: Verification Progress & Payment Selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                allVerified ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-700">
              {verifiedIds.size} of {items.length} Items Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Payment:</span>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-teal-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI / QR">UPI / QR Code</option>
              <option value="Card">Card</option>
              <option value="Hospital Credit">Hospital Credit</option>
            </select>
          </div>
        </div>

        {/* Right: Bill Total & Action CTAs */}
        <div className="flex items-center gap-3">
          <div className="text-right pr-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
              Total Medicine Bill
            </span>
            <span className="text-lg font-black font-mono text-slate-900 tracking-tight">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onDispense(prescriptionDetails, paymentMode, grandTotal)}
            disabled={isDispensing || items.length === 0}
            className="min-h-[44px] px-6 py-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDispensing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Dispensing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Dispense &amp; Complete Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
