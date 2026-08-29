import React, { useState } from 'react';
import MedicationDispenseRow from './MedicationDispenseRow';
import { getDailyTokenNumber, formatDoctorDisplayName } from '../../utils/formatters';
import { ClinicalBadge, MonospaceDataTag, TactileButton } from '../ui';

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
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mb-4 shadow-xs">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
          No Pending Prescriptions
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          All patient orders have been fulfilled. New prescriptions finalized by doctors will automatically appear in the live queue.
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
  const handleToggleVerify = (itemKey) => {
    setVerifiedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  // Select all or deselect all
  const handleVerifyAll = () => {
    if (verifiedIds.size === items.length) {
      setVerifiedIds(new Set());
    } else {
      const allKeys = new Set(items.map((it, idx) => it.matched_item_id || it.brand_name || idx));
      setVerifiedIds(allKeys);
    }
  };

  // Track modified quantities
  const handleQuantityChange = (itemKey, qty) => {
    setQuantities((prev) => ({
      ...prev,
      [itemKey]: qty,
    }));
  };

  // Calculate bill total
  const grandTotal = items.reduce((acc, curr, idx) => {
    const key = curr.matched_item_id || curr.brand_name || idx;
    const qty = quantities[key] !== undefined ? quantities[key] : (curr.quantity || 1);
    const price = parseFloat(curr.unit_price || 5.0);
    return acc + qty * price;
  }, 0);

  const allVerified = items.length > 0 && verifiedIds.size === items.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. Patient Clinical Banner */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 font-extrabold text-white flex items-center justify-center text-sm shadow-md border border-teal-500/30 shrink-0">
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
              <MonospaceDataTag
                value={`Token #${tokenNo}`}
                variant="teal"
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
              <span className="font-medium">{ageSex}</span>
              <span>•</span>
              <span className="font-mono text-teal-300 font-bold">{uhid}</span>
              <span>•</span>
              <span className="font-medium text-slate-200">{doctorName}</span>
            </div>
          </div>
        </div>

        {/* High-Visibility Allergy Flag */}
        {allergies.length > 0 ? (
          <ClinicalBadge variant="rose" size="md" pulse icon={<span>⚠️</span>}>
            Allergy: {allergies.join(', ')}
          </ClinicalBadge>
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
              <ClinicalBadge variant={allVerified ? 'emerald' : 'amber'} size="sm" mono>
                {verifiedIds.size}/{items.length} verified
              </ClinicalBadge>
            </div>

            <button
              type="button"
              onClick={handleVerifyAll}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              {allVerified ? 'Deselect All' : 'Verify All Items'}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const itemKey = item.matched_item_id || item.brand_name || index;
              const isVerified = verifiedIds.has(itemKey);
              const customQty = quantities[itemKey] !== undefined ? quantities[itemKey] : item.quantity;

              return (
                <MedicationDispenseRow
                  key={itemKey}
                  item={item}
                  index={index}
                  isVerified={isVerified}
                  onToggleVerify={() => handleToggleVerify(itemKey)}
                  onQuantityChange={(qty) => handleQuantityChange(itemKey, qty)}
                  currentQty={customQty}
                  onOpenStockReplenish={onOpenStockReplenish}
                />
              );
            })}

            {items.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No medication records available for this prescription.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sticky Reconciliation Footer & Action CTAs */}
      <div className="p-3.5 bg-white border-t border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Summary Chips */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                allVerified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
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

          <TactileButton
            onClick={() => onDispense(prescriptionDetails, paymentMode, grandTotal)}
            disabled={isDispensing || items.length === 0}
            loading={isDispensing}
            variant="primary"
            size="md"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          >
            Dispense &amp; Complete Order
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
