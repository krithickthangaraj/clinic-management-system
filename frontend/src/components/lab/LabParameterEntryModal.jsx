import React, { useState, useEffect } from 'react';
import { ClinicalBadge, MonospaceDataTag, TactileButton } from '../ui';

// Standard clinical panels with default parameter ranges
export const STANDARD_PANELS = {
  'Complete Blood Count': [
    { parameter_name: 'Hemoglobin', unit: 'g/dL', reference_range_low: 13.0, reference_range_high: 17.0, default_val: '' },
    { parameter_name: 'Total WBC Count', unit: '/cu.mm', reference_range_low: 4000, reference_range_high: 11000, default_val: '' },
    { parameter_name: 'Platelet Count', unit: 'Lakhs/cumm', reference_range_low: 1.5, reference_range_high: 4.5, default_val: '' },
    { parameter_name: 'RBC Count', unit: 'Mil/uL', reference_range_low: 4.5, reference_range_high: 5.5, default_val: '' },
    { parameter_name: 'PCV / Hematocrit', unit: '%', reference_range_low: 40.0, reference_range_high: 50.0, default_val: '' },
    { parameter_name: 'ESR (1st Hour)', unit: 'mm/hr', reference_range_low: 0, reference_range_high: 20, default_val: '' },
  ],
  'Lipid Profile': [
    { parameter_name: 'Total Cholesterol', unit: 'mg/dL', reference_range_low: 125, reference_range_high: 200, default_val: '' },
    { parameter_name: 'Triglycerides', unit: 'mg/dL', reference_range_low: 50, reference_range_high: 150, default_val: '' },
    { parameter_name: 'HDL Cholesterol (Good)', unit: 'mg/dL', reference_range_low: 40, reference_range_high: 60, default_val: '' },
    { parameter_name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', reference_range_low: 0, reference_range_high: 100, default_val: '' },
    { parameter_name: 'VLDL Cholesterol', unit: 'mg/dL', reference_range_low: 5, reference_range_high: 30, default_val: '' },
  ],
  'Renal Function Test (RFT)': [
    { parameter_name: 'Serum Creatinine', unit: 'mg/dL', reference_range_low: 0.6, reference_range_high: 1.2, default_val: '' },
    { parameter_name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', reference_range_low: 7, reference_range_high: 20, default_val: '' },
    { parameter_name: 'Serum Uric Acid', unit: 'mg/dL', reference_range_low: 3.5, reference_range_high: 7.2, default_val: '' },
    { parameter_name: 'Serum Sodium (Na+)', unit: 'mEq/L', reference_range_low: 135, reference_range_high: 145, default_val: '' },
    { parameter_name: 'Serum Potassium (K+)', unit: 'mEq/L', reference_range_low: 3.5, reference_range_high: 5.0, default_val: '' },
  ],
  'Blood Glucose Profile': [
    { parameter_name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', reference_range_low: 70, reference_range_high: 100, default_val: '' },
    { parameter_name: 'Post-Prandial Blood Sugar (PPBS)', unit: 'mg/dL', reference_range_low: 70, reference_range_high: 140, default_val: '' },
    { parameter_name: 'HbA1c (Glycated Hemoglobin)', unit: '%', reference_range_low: 4.0, reference_range_high: 5.7, default_val: '' },
  ],
};

/**
 * Auto-evaluates observed value against reference range
 */
export function evaluateParameterFlag(valStr, low, high) {
  if (!valStr || String(valStr).trim() === '') return 'NORMAL';
  const val = parseFloat(String(valStr).trim());
  if (isNaN(val)) return 'NORMAL';

  if (low !== null && low !== undefined && val < low) {
    if (low > 0 && val < low * 0.6) return 'CRITICAL';
    return 'LOW';
  }
  if (high !== null && high !== undefined && val > high) {
    if (high > 0 && val > high * 1.5) return 'CRITICAL';
    return 'HIGH';
  }
  return 'NORMAL';
}

export default function LabParameterEntryModal({
  isOpen = false,
  onClose = () => {},
  visitId = null,
  orderDetails = null,
  masterTests = [],
  onFinalize = () => {},
  isFinalizing = false,
}) {
  const [testTitle, setTestTitle] = useState('Complete Blood Count (CBC)');
  const [parameters, setParameters] = useState([]);
  const [technicianRemarks, setTechnicianRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);

  // Initialize parameters when order opens
  useEffect(() => {
    if (!isOpen || !orderDetails) return;

    const prescribedList = orderDetails.prescribed_tests || [];
    let initialList = [];

    // Check if prescribed tests match known standard panels
    const matchedPanelKey = Object.keys(STANDARD_PANELS).find((key) =>
      prescribedList.some((p) => p.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(p.toLowerCase()))
    );

    if (matchedPanelKey) {
      setTestTitle(matchedPanelKey);
      initialList = STANDARD_PANELS[matchedPanelKey].map((p) => ({
        ...p,
        observed_value: '',
        flag: 'NORMAL',
      }));
    } else if (orderDetails.existing_results && orderDetails.existing_results.length > 0) {
      initialList = orderDetails.existing_results.map((r) => {
        let low = null;
        let high = null;
        if (r.normal_range && r.normal_range.includes('-')) {
          const parts = r.normal_range.split('-').map((p) => parseFloat(p.trim()));
          if (!isNaN(parts[0])) low = parts[0];
          if (!isNaN(parts[1])) high = parts[1];
        }
        return {
          parameter_name: r.test_name,
          unit: r.unit || '',
          reference_range_low: low,
          reference_range_high: high,
          observed_value: r.result_value || '',
          flag: r.is_abnormal ? 'HIGH' : 'NORMAL',
        };
      });
    } else if (prescribedList.length > 0) {
      setTestTitle(prescribedList.join(', '));
      initialList = prescribedList.map((tName) => {
        const master = masterTests.find((m) => m.test_name.toLowerCase().includes(tName.toLowerCase()));
        let low = null;
        let high = null;
        if (master?.normal_range && master.normal_range.includes('-')) {
          const parts = master.normal_range.split('-').map((p) => parseFloat(p.trim()));
          if (!isNaN(parts[0])) low = parts[0];
          if (!isNaN(parts[1])) high = parts[1];
        }
        return {
          parameter_name: master?.test_name || tName,
          unit: master?.unit || '',
          reference_range_low: low,
          reference_range_high: high,
          observed_value: '',
          flag: 'NORMAL',
        };
      });
    } else {
      // Default to CBC panel
      setTestTitle('Complete Blood Count (CBC)');
      initialList = STANDARD_PANELS['Complete Blood Count'].map((p) => ({
        ...p,
        observed_value: '',
        flag: 'NORMAL',
      }));
    }

    setParameters(initialList);
    setTechnicianRemarks('');
    setAttachment(null);
  }, [isOpen, orderDetails, masterTests]);

  if (!isOpen || !orderDetails) return null;

  const patientName = orderDetails.patient_name || 'Patient';
  const uhid = orderDetails.patient_id || 'PAT-10482';
  const visitNumber = orderDetails.visit_number || 'Token #01';
  const ageSex = orderDetails.age_sex || '—';
  const doctorName = orderDetails.doctor_name || 'Attending Consultant';

  const handleValueChange = (index, value) => {
    setParameters((prev) => {
      const next = [...prev];
      const target = { ...next[index], observed_value: value };
      target.flag = evaluateParameterFlag(value, target.reference_range_low, target.reference_range_high);
      next[index] = target;
      return next;
    });
  };

  const handleAddCustomParameter = () => {
    setParameters((prev) => [
      ...prev,
      {
        parameter_name: 'Custom Parameter',
        unit: 'mg/dL',
        reference_range_low: 0,
        reference_range_high: 100,
        observed_value: '',
        flag: 'NORMAL',
      },
    ]);
  };

  const handleRemoveParameter = (index) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        url: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Format summary string
    const summaryParts = parameters
      .filter((p) => p.observed_value.trim() !== '')
      .map((p) => {
        const flagSuffix = p.flag !== 'NORMAL' ? ` [${p.flag.toUpperCase()}]` : '';
        return `${p.parameter_name}: ${p.observed_value} ${p.unit || ''}${flagSuffix}`.trim();
      });

    const resultSummary = summaryParts.join(' • ') || 'All parameters evaluated normal.';

    const payload = {
      order_id: orderDetails.id || orderDetails.order_id || null,
      visit_id: orderDetails.visit_id || visitId,
      test_name: testTitle,
      parameters: parameters.map((p) => ({
        parameter_name: p.parameter_name,
        observed_value: p.observed_value,
        unit: p.unit || '',
        reference_range_low: p.reference_range_low,
        reference_range_high: p.reference_range_high,
        flag: p.flag,
      })),
      technician_remarks: technicianRemarks,
      result_summary: resultSummary,
      pdf_attachment_url: attachment?.url || null,
    };

    onFinalize(payload);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className="relative z-[1001] w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn"
        data-testid="lab-parameter-entry-modal"
      >
        {/* 1. Glassmorphic Slate-900 Header Banner */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 shadow-md">
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
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                  {patientName}
                </h3>
                <MonospaceDataTag value={visitNumber} variant="teal" size="sm" />
                <span className="font-mono text-xs font-bold text-slate-300">
                  {uhid}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 flex-wrap">
                <span className="font-medium">{ageSex}</span>
                <span>•</span>
                <span className="text-slate-300">Ref by: {doctorName}</span>
                <span>•</span>
                <span className="font-bold text-teal-400 truncate">{testTitle}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 2. Modal Body (Scrollable Form) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 ultra-thin-scrollbar">
            {/* Quick Panel Switcher */}
            <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Standard Panel:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.keys(STANDARD_PANELS).map((pKey) => (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => {
                        setTestTitle(pKey);
                        setParameters(
                          STANDARD_PANELS[pKey].map((p) => ({
                            ...p,
                            observed_value: '',
                            flag: 'NORMAL',
                          }))
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        testTitle === pKey
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pKey.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustomParameter}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"
              >
                + Add Parameter
              </button>
            </div>

            {/* Parameter Entry Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Parameter Name</th>
                    <th className="py-2.5 px-3 w-36">Observed Value *</th>
                    <th className="py-2.5 px-3 w-36 font-mono">Reference Range</th>
                    <th className="py-2.5 px-2.5 w-20">Unit</th>
                    <th className="py-2.5 px-3 w-32 text-center">Clinical Flag</th>
                    <th className="py-2.5 px-2 w-10 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters.map((param, index) => {
                    const isLow = param.flag === 'LOW';
                    const isHigh = param.flag === 'HIGH';
                    const isCritical = param.flag === 'CRITICAL';
                    const isAbnormal = isLow || isHigh || isCritical;

                    return (
                      <tr
                        key={index}
                        className={`transition-colors ${
                          isCritical
                            ? 'bg-rose-50/50'
                            : isAbnormal
                            ? 'bg-amber-50/40'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {param.parameter_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            name={param.parameter_name}
                            placeholder="Enter val"
                            value={param.observed_value}
                            onChange={(e) => handleValueChange(index, e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all focus:outline-none ${
                              isCritical
                                ? 'bg-rose-50 border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                                : isAbnormal
                                ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-2 focus:ring-amber-500/20'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                            }`}
                            data-testid={`param-input-${index}`}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                          {param.reference_range_low !== null && param.reference_range_high !== null
                            ? `${param.reference_range_low} - ${param.reference_range_high}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-500 text-[11px]">
                          {param.unit || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <span>🚨 CRITICAL</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              <span>↓ LOW</span>
                            </span>
                          ) : isHigh ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              <span>↑ HIGH</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              NORMAL
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveParameter(index)}
                            className="text-slate-400 hover:text-rose-600 font-bold p-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PDF / Image Attachment & Remarks Dropzone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Dropzone */}
              <div className="p-3.5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  id="lab-attachment-input"
                  className="hidden"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                />
                <label htmlFor="lab-attachment-input" className="cursor-pointer block">
                  {attachment ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-teal-200 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-teal-700 font-bold">📄</span>
                        <span className="font-bold text-slate-800 truncate">{attachment.name}</span>
                        <span className="text-slate-400 text-[10px]">({attachment.size})</span>
                      </div>
                      <span className="text-teal-700 font-bold text-xs">Change</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <svg className="w-6 h-6 mx-auto text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-xs font-bold text-slate-700">Attach Official Lab Report (PDF / Image)</p>
                      <p className="text-[10px] text-slate-400">Drag and drop or browse from computer</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Remarks */}
              <div>
                <textarea
                  placeholder="Technician observations, morphology notes, or clinical remarks..."
                  rows={3}
                  value={technicianRemarks}
                  onChange={(e) => setTechnicianRemarks(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 3. Sticky Action Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>{parameters.length} Parameters Evaluated</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">
                {parameters.filter((p) => p.flag !== 'NORMAL').length} Flagged Abnormal
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <TactileButton
                type="submit"
                disabled={isFinalizing}
                loading={isFinalizing}
                variant="primary"
                size="md"
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              >
                Finalize &amp; Send to Doctor
              </TactileButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
