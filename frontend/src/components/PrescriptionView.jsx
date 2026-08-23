import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { prescriptionService } from '../services/prescriptionService';
import './PrescriptionView.css';

/**
 * Format datetime helper
 */
const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return format(new Date(value), 'dd MMM yyyy, hh:mm a');
  } catch {
    return String(value);
  }
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return format(new Date(value), 'dd MMM yyyy');
  } catch {
    return String(value);
  }
};

/**
 * Format age helper
 */
const formatAge = (visit, patient) => {
  const parts = [];
  const age = patient?.age ?? visit?.patient_age ?? patient?.age_years;
  const months = patient?.age_months ?? visit?.patient_age_months;

  if (age != null && age !== '') parts.push(`${age} Y`);
  if (months != null && months > 0) {
    parts.push(`${months} M`);
  }
  return parts.join(' ') || 'N/A';
};

/**
 * Printable Prescription Page Component
 * Strict Adherence:
 * 1. Physical Letterhead Spacing: Dedicated top margin (print-letterhead-space) for pre-printed hospital letterhead.
 * 2. Exact Data Mapping:
 *    - Patient Meta & Vitals Ribbon (HT, WT, BMI, BP, PR, SPO2, TEMP, RBS/GRBS)
 *    - Clinical Assessment (Complaints, Diagnosis, Past History, Allergies, Examination)
 *    - Strict RX Medication Table (S.No, Brand Name, Drug Name, Dosage, Frequency, Days, Instructions, Quantity)
 *    - Post-Consultation Footer (Lab Reports, Next Investigations, Procedure, Referral, Advice, Follow-up, Amount, Doctor Signature)
 * 3. Print & Complete Workflow:
 *    - Trigger Print -> Mark Status Completed -> Redirect to Doctor Queue/Desk
 */
export default function PrescriptionView({
  visitId,
  visit = {},
  patient = {},
  vitals = {},
  medicines = [],
  chiefComplaints = [],
  diagnosis = '',
  history = {},
  examination = '',
  labReportsReviewed = '',
  orderedTests = [],
  procedure = '',
  referral = '',
  advice = '',
  followUpDate = '',
  totalAmount = 0,
  doctorFee = 0,
  doctorName = 'Consultant Physician',
  onBack = () => {},
  onPrintedAndCompleted = () => {},
}) {
  const prescriptionRef = useRef();
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Patient Details
  const patientName =
    patient?.name || visit?.patient?.name || visit?.patient_name || 'Patient';
  const patientAge = formatAge(visit, patient);
  const patientGender =
    patient?.gender || visit?.patient?.gender || visit?.patient_gender || 'N/A';
  const patientPhone =
    patient?.phone || visit?.patient?.phone || visit?.patient_phone || 'N/A';
  const patientIdFormatted =
    patient?.patient_id ||
    visit?.patient?.patient_id ||
    (visit?.patient_id ? `PAT-${String(visit.patient_id).padStart(5, '0')}` : 'N/A');
  const visitNumber =
    visit?.visit_number || (visitId ? `VIS-${visitId}` : 'N/A');
  const visitDateTime = formatDateTime(visit?.created_at || new Date());

  // 2. Vitals Line (HT, WT, BMI, BP, PR, SPO2, TEMP, RBS/GRBS)
  const vitalsArray = [
    (vitals?.height_cm != null && vitals.height_cm !== '') && `HT: ${vitals.height_cm} cm`,
    ((vitals?.weight_kg ?? vitals?.weight) != null && (vitals.weight_kg ?? vitals.weight) !== '') &&
      `WT: ${vitals.weight_kg ?? vitals.weight} kg`,
    (vitals?.bmi != null && vitals.bmi !== '') && `BMI: ${vitals.bmi}`,
    (vitals?.bp_systolic && vitals?.bp_diastolic) &&
      `BP: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg`,
    ((vitals?.pulse_bpm ?? vitals?.pr) != null && (vitals.pulse_bpm ?? vitals.pr) !== '') &&
      `PR: ${vitals.pulse_bpm ?? vitals.pr} bpm`,
    (vitals?.spo2 != null && vitals.spo2 !== '') && `SPO2: ${vitals.spo2}%`,
    ((vitals?.temp_f ?? vitals?.temperature) != null && (vitals.temp_f ?? vitals.temperature) !== '') &&
      `TEMP: ${vitals.temp_f ?? vitals.temperature}°F`,
    ((vitals?.grbs ?? vitals?.sugar) != null && (vitals.grbs ?? vitals.sugar) !== '') &&
      `RBS: ${vitals.grbs ?? vitals.sugar} mg/dL`,
    (vitals?.rr != null && vitals.rr !== '') && `RR: ${vitals.rr}/min`,
  ].filter(Boolean);

  // 3. Normalize Clinical Assessment
  const complaintsList = Array.isArray(chiefComplaints)
    ? chiefComplaints
        .map((c) => (typeof c === 'string' ? c : c?.complaint ? `${c.complaint}${c.duration ? ` (${c.duration})` : ''}` : ''))
        .filter(Boolean)
    : chiefComplaints
    ? [String(chiefComplaints)]
    : [];

  const diagnosisStr = Array.isArray(diagnosis)
    ? diagnosis.filter(Boolean).join(', ')
    : typeof diagnosis === 'string'
    ? diagnosis
    : '';

  // 4. Normalize Medical History
  const allergyList = Array.isArray(history?.allergy_history)
    ? history.allergy_history.filter(Boolean)
    : [];
  const pastList = Array.isArray(history?.past_history)
    ? history.past_history.filter(Boolean)
    : [];
  const surgicalList = Array.isArray(history?.surgical_history)
    ? history.surgical_history.filter(Boolean)
    : [];
  const familyList = Array.isArray(history?.family_history)
    ? history.family_history.filter(Boolean)
    : [];

  // 5. Normalize Medicines
  const medsList = Array.isArray(medicines)
    ? medicines.filter((m) => m && (m.drug_name || m.name))
    : [];

  // 6. Normalize Ordered Tests
  const testsList = Array.isArray(orderedTests)
    ? orderedTests
        .map((t) => (typeof t === 'string' ? t : t?.test_name || t?.name || ''))
        .filter(Boolean)
    : [];

  // 7. Print & Complete Workflow
  const handlePrintAndComplete = useReactToPrint({
    content: () => prescriptionRef.current,
    documentTitle: `Prescription-${visitNumber}`,
    onBeforeGetContent: () => {
      setIsProcessing(true);
    },
    onAfterPrint: async () => {
      try {
        if (visitId) {
          const p = await prescriptionService.getByVisit(visitId);
          if (p?.id) {
            await prescriptionService.markPrinted(p.id);
          }
        }
      } catch (err) {
        console.warn('Failed to mark prescription printed:', err);
      } finally {
        setIsProcessing(false);
        if (onPrintedAndCompleted) {
          onPrintedAndCompleted();
        }
      }
    },
  });

  return (
    <div className="prescription-wrapper w-full flex flex-col items-center">
      {/* On-Screen Action Header Bar (Hidden during printing) */}
      <div className="prescription-actions no-print w-full max-w-4xl flex items-center justify-between p-3 mb-4 bg-slate-900 text-white rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            data-testid="btn-back-consultation"
          >
            <span>&larr; Back to Consultation</span>
          </button>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Review Sheet &bull; Ready for A4 Print
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrintAndComplete}
          disabled={isProcessing}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          data-testid="btn-print-and-complete"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>{isProcessing ? 'Processing...' : 'Print Prescription'}</span>
        </button>
      </div>

      {/* Printable Paper Document (Formatted exactly for physical A4 Sheet) */}
      <div
        ref={prescriptionRef}
        className="prescription-page-container bg-white text-slate-900 font-sans shadow-xl print:shadow-none w-full max-w-4xl p-8 sm:p-10 rounded-xl print:rounded-none print:p-0 print:m-0"
        data-testid="printable-prescription-document"
      >
        {/* =========================================================================
            PART 1: Physical Hospital Letterhead Space (Blank Margin for Pre-printed Header)
           ========================================================================= */}
        <div className="print-letterhead-space w-full" style={{ minHeight: '135px' }} />

        {/* =========================================================================
            PART 2: Exact Data Mapping
           ========================================================================= */}

        {/* 1. PATIENT DEMOGRAPHICS & VITALS (Top Section) */}
        <section className="border-b-2 border-slate-800 pb-2.5 mb-3 text-xs leading-relaxed">
          {/* Patient Meta Line 1 */}
          <div className="flex items-center justify-between font-semibold text-slate-900 pb-1 border-b border-slate-200">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Patient Name</span>
              <strong className="text-sm font-bold text-slate-950 uppercase">{patientName}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Date &amp; Time</span>
              <span className="font-mono font-medium">{visitDateTime}</span>
            </div>
          </div>

          {/* Patient Meta Line 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 text-slate-800">
            <div>
              <span className="text-slate-500 font-medium">Patient ID: </span>
              <strong className="font-mono">{patientIdFormatted}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Visit No: </span>
              <strong className="font-mono">{visitNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Age / Gender: </span>
              <strong>{patientAge} / {patientGender}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Phone: </span>
              <strong>{patientPhone}</strong>
            </div>
          </div>

          {/* Vitals String / Ribbon */}
          {vitalsArray.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-800 bg-slate-50 print:bg-transparent px-2.5 py-1 rounded print:px-0">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Vitals:</span>
              {vitalsArray.map((vital, idx) => (
                <span key={idx} className="inline-flex items-center gap-1">
                  {vital}
                  {idx < vitalsArray.length - 1 && <span className="text-slate-300 ml-2">&bull;</span>}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 2. CLINICAL ASSESSMENT & FINDINGS */}
        {(complaintsList.length > 0 || diagnosisStr || allergyList.length > 0 || pastList.length > 0 || examination) && (
          <section className="mb-3 space-y-1.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {/* Chief Complaints */}
              {complaintsList.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-0.5">
                    Chief Complaints:
                  </h4>
                  <p className="text-slate-800 font-medium leading-tight">
                    {complaintsList.join(', ')}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              {diagnosisStr && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-0.5">
                    Diagnosis:
                  </h4>
                  <p className="text-slate-900 font-bold leading-tight">
                    {diagnosisStr}
                  </p>
                </div>
              )}
            </div>

            {/* Medical History & Allergies */}
            {(allergyList.length > 0 || pastList.length > 0 || surgicalList.length > 0 || familyList.length > 0) && (
              <div className="pt-1 text-[11px] text-slate-700 flex flex-wrap gap-x-4 gap-y-0.5">
                {allergyList.length > 0 && (
                  <div>
                    <strong className="text-rose-700 font-bold">Allergies: </strong>
                    <span>{allergyList.join(', ')}</span>
                  </div>
                )}
                {pastList.length > 0 && (
                  <div>
                    <strong className="text-slate-800 font-semibold">Past History: </strong>
                    <span>{pastList.join(', ')}</span>
                  </div>
                )}
                {surgicalList.length > 0 && (
                  <div>
                    <strong className="text-slate-800 font-semibold">Surgical: </strong>
                    <span>{surgicalList.join(', ')}</span>
                  </div>
                )}
                {familyList.length > 0 && (
                  <div>
                    <strong className="text-slate-800 font-semibold">Family: </strong>
                    <span>{familyList.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Physical Examination */}
            {examination && (
              <div className="pt-0.5 text-[11px] text-slate-800">
                <strong className="font-bold text-slate-900 uppercase text-[10.5px]">Examination: </strong>
                <span>{examination}</span>
              </div>
            )}
          </section>
        )}

        {/* 3. RX MEDICATION TABLE */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-serif font-bold text-base text-slate-900">℞</span>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              Prescribed Medications
            </h4>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100/60 border-b border-slate-300 font-bold text-slate-900 text-[10.5px] uppercase tracking-wider">
                <th className="py-1 px-1.5 w-10 text-center border-r border-slate-300">S.No</th>
                <th className="py-1 px-2 w-32 border-r border-slate-300">Brand Name</th>
                <th className="py-1 px-2 border-r border-slate-300">Drug Name</th>
                <th className="py-1 px-2 w-20 border-r border-slate-300">Dosage</th>
                <th className="py-1 px-2 w-28 border-r border-slate-300">Frequency</th>
                <th className="py-1 px-1.5 w-14 text-center border-r border-slate-300">Days</th>
                <th className="py-1 px-2 w-28 border-r border-slate-300">Instructions</th>
                <th className="py-1 px-1.5 w-16 text-center">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
              {medsList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-3 text-center text-slate-400 italic">
                    No medications prescribed.
                  </td>
                </tr>
              ) : (
                medsList.map((med, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="py-1 px-1.5 text-center font-mono text-slate-600 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2 font-medium text-slate-700 border-r border-slate-200">
                      {med.brand_name || '-'}
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-950 border-r border-slate-200">
                      {med.drug_name || med.name}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-200">
                      {med.dosage || '-'}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-200 font-medium">
                      {med.frequency || '-'}
                    </td>
                    <td className="py-1 px-1.5 text-center font-mono font-semibold border-r border-slate-200">
                      {med.days ?? med.number_of_days ?? 1}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-200 text-slate-800">
                      {med.instructions || 'After food'}
                    </td>
                    <td className="py-1 px-1.5 text-center font-mono font-bold">
                      {med.quantity || 1}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* 4. POST-CONSULTATION FOOTER (Diagnostic Tests, Advice, Follow-up & Doctor Signature) */}
        <footer className="border-t-2 border-slate-800 pt-2.5 text-xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {/* Left Column: Diagnostics, Procedure & Advice */}
            <div className="space-y-1.5">
              {labReportsReviewed && (
                <div>
                  <strong className="font-bold text-slate-900 uppercase text-[10.5px]">
                    Lab Reports Reviewed:
                  </strong>
                  <p className="text-slate-800 leading-tight">{labReportsReviewed}</p>
                </div>
              )}

              {testsList.length > 0 && (
                <div>
                  <strong className="font-bold text-slate-900 uppercase text-[10.5px]">
                    Investigations on Next Review:
                  </strong>
                  <p className="text-slate-900 font-semibold leading-tight">{testsList.join(', ')}</p>
                </div>
              )}

              {(procedure || referral) && (
                <div className="space-y-0.5">
                  {procedure && (
                    <div>
                      <strong className="font-bold text-slate-900 uppercase text-[10.5px]">Procedure: </strong>
                      <span>{procedure}</span>
                    </div>
                  )}
                  {referral && (
                    <div>
                      <strong className="font-bold text-slate-900 uppercase text-[10.5px]">Referral: </strong>
                      <span>{referral}</span>
                    </div>
                  )}
                </div>
              )}

              {advice && (
                <div>
                  <strong className="font-bold text-slate-900 uppercase text-[10.5px]">
                    Dietary &amp; Lifestyle Advice:
                  </strong>
                  <p className="text-slate-800 leading-tight whitespace-pre-wrap">{advice}</p>
                </div>
              )}
            </div>

            {/* Right Column: Follow-up, Billing & Doctor Signature */}
            <div className="flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                {followUpDate && (
                  <div className="p-2 bg-slate-50 print:bg-transparent border border-slate-200 print:border-none rounded">
                    <strong className="font-bold text-slate-900 uppercase text-[10.5px] block">
                      Next Review Date:
                    </strong>
                    <span className="text-sm font-bold text-slate-900">{formatDate(followUpDate)}</span>
                  </div>
                )}

                {(totalAmount > 0 || doctorFee > 0) && (
                  <div className="text-[11px] text-slate-700">
                    <span className="font-semibold">Consultation Amount: </span>
                    <strong className="font-mono text-slate-900 text-xs">₹{totalAmount || doctorFee}</strong>
                  </div>
                )}
              </div>

              {/* Doctor Signature Block */}
              <div className="pt-6 text-right">
                <div className="inline-block text-center min-w-[160px]">
                  <div className="border-b border-slate-400 mb-1 w-40 ml-auto" />
                  <strong className="text-xs font-bold text-slate-900 block">{doctorName}</strong>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Doctor Signature &amp; Seal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
