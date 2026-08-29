import React, { useState, useEffect, useMemo } from 'react';
import billingService from '../../services/billingService';

const PAYMENT_MODES = [
  { id: 'Cash', label: 'Cash', icon: '💵' },
  { id: 'UPI', label: 'UPI QR', icon: '📱' },
  { id: 'Card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'Credit', label: 'Hospital Credit', icon: '📋' },
];

/**
 * High-Density Point-of-Sale (POS) Clinic Master Invoice & Multi-Mode Billing Modal
 */
export default function POSBillingModal({
  isOpen = false,
  onClose = () => {},
  visitId,
  onSettled = () => {},
}) {
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [settledSuccess, setSettledSuccess] = useState(null);

  // Calculation State
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState(5); // 5% GST
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [cashierNotes, setCashierNotes] = useState('');

  // Fetch 3-Tier Rollup Summary on Open
  useEffect(() => {
    if (!isOpen || !visitId) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    billingService
      .getBillingSummary(visitId)
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load billing summary:', err);
          setError(err.response?.data?.detail || 'Failed to aggregate billing records.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, visitId]);

  // Gross Subtotal
  const subtotal = summary?.gross_total || 0;

  // Discount Calculation
  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percent') {
      return round((subtotal * Math.min(100, discountValue)) / 100);
    }
    return round(Math.min(subtotal, discountValue));
  }, [subtotal, discountType, discountValue]);

  // Tax Calculation
  const taxAmount = useMemo(() => {
    if (!enableTax || taxRate <= 0) return 0;
    const taxableBase = Math.max(0, subtotal - discountAmount);
    return round((taxableBase * taxRate) / 100);
  }, [subtotal, discountAmount, enableTax, taxRate]);

  // Grand Total Payable
  const grandTotal = useMemo(() => {
    const net = subtotal - discountAmount + taxAmount;
    return Math.max(0, round(net));
  }, [subtotal, discountAmount, taxAmount]);

  function round(val) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  // Dynamic UPI Intent String
  const upiIntentString = useMemo(() => {
    const vpa = 'konguhospital@upi';
    const name = encodeURIComponent('KONGU HOSPITAL');
    const amount = grandTotal.toFixed(2);
    const note = encodeURIComponent(`INV-VISIT-${visitId}`);
    return `upi://pay?pa=${vpa}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
  }, [grandTotal, visitId]);

  // Handle Settle Invoice
  const handleSettleInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!summary) return;

    setSettling(true);
    try {
      const payload = {
        visit_id: summary.visit_id,
        patient_id: summary.patient_id,
        items: summary.line_items || [],
        subtotal: summary.gross_total,
        discount_amount: discountAmount,
        discount_percentage: discountType === 'percent' ? Number(discountValue) : 0,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        payment_mode: paymentMode,
        transaction_reference: transactionRef.trim() || undefined,
        cashier_notes: cashierNotes.trim() || undefined,
      };

      const res = await billingService.settleInvoice(payload);
      setSettledSuccess(res);
      if (onSettled) onSettled(res);
    } catch (err) {
      console.error('Failed to settle invoice:', err);
      alert(err.response?.data?.detail || 'Failed to settle invoice. Please try again.');
    } finally {
      setSettling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
        data-testid="pos-billing-modal"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
          {/* 1. Modal Top Bar */}
          <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold tracking-wide uppercase font-sans">
                  Point-of-Sale Master Billing &amp; Checkout
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  Visit Token: #{summary?.visit_id} &bull; UHID: {summary?.uhid}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold text-base cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="py-24 text-center text-slate-500 font-medium text-xs flex flex-col items-center gap-3">
              <span className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
              <span>Aggregating 3-tier clinical services (Doctor + Labs + Pharmacy)…</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 font-medium text-xs">
              <p className="font-bold">Error loading billing details:</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
              {/* =========================================================================
                  LEFT PANE (7/12): 3-Tier Itemized Service Breakdown
                 ========================================================================= */}
              <div className="md:col-span-7 p-5 bg-slate-50/70 border-r border-slate-200 flex flex-col space-y-4 overflow-y-auto">
                {/* Patient Demographic Card */}
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                      {summary?.patient_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{summary?.patient_name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {summary?.age_sex} &bull; <span className="font-mono">{summary?.uhid}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Attending</span>
                    <span className="text-xs font-semibold text-slate-800">{summary?.doctor_name}</span>
                  </div>
                </div>

                {/* 3-Tier Service Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Clinical Service Breakdown</span>
                    <span className="text-slate-400 font-mono font-medium text-[10px]">
                      {summary?.line_items?.length || 0} Line Items
                    </span>
                  </h4>

                  {/* Tier 1: Doctor Consultation */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-600" />
                        <span>1. Doctor Consultation</span>
                      </div>
                      <span className="font-mono text-teal-800">₹ {(summary?.consultation_fee || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 pl-4">
                      OPD Examination &bull; Attending: {summary?.doctor_name}
                    </p>
                  </div>

                  {/* Tier 2: Diagnostic Labs */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>2. Diagnostic Investigations</span>
                      </div>
                      <span className="font-mono text-amber-800">₹ {(summary?.lab_total || 0).toFixed(2)}</span>
                    </div>
                    {summary?.line_items?.filter((i) => i.category === 'LABORATORY').length === 0 ? (
                      <p className="text-[10px] text-slate-400 pl-4 italic">No lab tests ordered for this visit.</p>
                    ) : (
                      <div className="pl-4 space-y-1 pt-1">
                        {summary?.line_items
                          ?.filter((i) => i.category === 'LABORATORY')
                          .map((l, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                              <span>&bull; {l.item_name}</span>
                              <span className="font-mono font-semibold">₹ {l.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Tier 3: Pharmacy Medications */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>3. Pharmacy Medications</span>
                      </div>
                      <span className="font-mono text-emerald-800">₹ {(summary?.pharmacy_total || 0).toFixed(2)}</span>
                    </div>
                    {summary?.line_items?.filter((i) => i.category === 'PHARMACY').length === 0 ? (
                      <p className="text-[10px] text-slate-400 pl-4 italic">No pharmacy items dispensed.</p>
                    ) : (
                      <div className="pl-4 space-y-1 pt-1">
                        {summary?.line_items
                          ?.filter((i) => i.category === 'PHARMACY')
                          .map((p, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                              <span>
                                &bull; {p.item_name} <span className="text-slate-400 text-[10px]">({p.quantity} Qty &times; ₹{p.unit_price})</span>
                              </span>
                              <span className="font-mono font-semibold">₹ {p.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  RIGHT PANE (5/12): Settlement & Payment Calculations
                 ========================================================================= */}
              <div className="md:col-span-5 p-5 bg-white flex flex-col justify-between space-y-4">
                {/* 1. Calculations & Adjustments Card */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Settlement &amp; Billing
                  </h4>

                  {/* Subtotal Display */}
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono text-sm text-slate-900">₹ {subtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount Input */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Discount:</span>
                      <div className="inline-flex rounded-md shadow-2xs border border-slate-300 overflow-hidden text-[10px]">
                        <button
                          type="button"
                          className={`px-2 py-0.5 font-bold cursor-pointer transition-colors ${
                            discountType === 'percent' ? 'bg-teal-700 text-white' : 'bg-white text-slate-700'
                          }`}
                          onClick={() => setDiscountType('percent')}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-0.5 font-bold cursor-pointer transition-colors ${
                            discountType === 'fixed' ? 'bg-teal-700 text-white' : 'bg-white text-slate-700'
                          }`}
                          onClick={() => setDiscountType('fixed')}
                        >
                          ₹
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percent' ? 100 : subtotal}
                        step="any"
                        placeholder="0"
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                        data-testid="input-discount"
                      />
                      {discountAmount > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                          - ₹{discountAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Optional Tax / GST */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={enableTax}
                        onChange={(e) => setEnableTax(e.target.checked)}
                        className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
                      />
                      <span>Apply 5% GST</span>
                    </label>
                    {taxAmount > 0 && (
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        + ₹{taxAmount.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Grand Total Banner */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">
                        Net Amount Payable
                      </span>
                      <span className="text-[11px] text-teal-400 font-semibold">Inclusive of all services</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-2xl font-black text-emerald-400" data-testid="pos-grand-total">
                        ₹ {grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Mode Selector Pills */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PAYMENT_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            paymentMode === mode.id
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                          data-testid={`payment-mode-${mode.id.toLowerCase()}`}
                        >
                          <span>{mode.icon}</span>
                          <span className="truncate">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic UPI QR Popover if UPI selected */}
                  {paymentMode === 'UPI' && (
                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-center animate-in fade-in">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-teal-900">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Dynamic Instant Scan &amp; Pay</span>
                      </div>

                      {/* SVG QR Code Simulation */}
                      <div className="flex justify-center py-1">
                        <div className="p-2 bg-white rounded-lg border border-teal-200 shadow-2xs">
                          <svg
                            className="w-24 h-24 text-slate-900"
                            viewBox="0 0 100 100"
                            fill="currentColor"
                            data-testid="upi-qr-code"
                          >
                            <rect width="100" height="100" fill="white" />
                            {/* QR Finder patterns */}
                            <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
                            <rect x="9" y="9" width="17" height="17" fill="white" />
                            <rect x="13" y="13" width="9" height="9" fill="#0f172a" />
                            
                            <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
                            <rect x="74" y="9" width="17" height="17" fill="white" />
                            <rect x="78" y="13" width="9" height="9" fill="#0f172a" />
                            
                            <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
                            <rect x="9" y="74" width="17" height="17" fill="white" />
                            <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

                            {/* Data grid sample dots */}
                            <rect x="36" y="10" width="6" height="6" fill="#0f172a" />
                            <rect x="46" y="20" width="6" height="6" fill="#0f172a" />
                            <rect x="36" y="36" width="28" height="28" fill="#0f172a" />
                            <rect x="42" y="42" width="16" height="16" fill="white" />
                            <rect x="46" y="46" width="8" height="8" fill="#0f172a" />
                            <rect x="70" y="40" width="6" height="6" fill="#0f172a" />
                            <rect x="80" y="55" width="6" height="6" fill="#0f172a" />
                            <rect x="40" y="75" width="6" height="6" fill="#0f172a" />
                            <rect x="55" y="80" width="6" height="6" fill="#0f172a" />
                            <rect x="75" y="75" width="15" height="15" fill="#0f172a" />
                          </svg>
                        </div>
                      </div>

                      <div className="text-[10px] text-teal-800 font-mono font-semibold">
                        VPA: konguhospital@upi &bull; Amount: ₹{grandTotal.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Transaction Ref for Card / UPI */}
                  {(paymentMode === 'Card' || paymentMode === 'UPI') && (
                    <input
                      type="text"
                      placeholder="Transaction / UTR Reference (Optional)"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  )}
                </div>

                {/* 2. Primary CTA: Confirm Payment & Settle Bill */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSettleInvoice}
                    disabled={settling}
                    className="flex-1 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    data-testid="btn-settle-invoice"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>{settling ? 'Settling Master Invoice…' : 'Confirm & Settle Payment'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Overlay once Settled */}
          {settledSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center text-2xl font-bold shadow-md animate-bounce">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Invoice Settled Successfully!</h3>
                <p className="text-xs text-slate-600 font-mono">
                  Receipt: <strong>{settledSuccess.invoice_number}</strong> &bull; Amount: ₹{settledSuccess.grand_total?.toFixed(2)} ({settledSuccess.payment_mode})
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Visit #{settledSuccess.visit_id} marked as completed.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
