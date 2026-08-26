import React, { useState } from 'react';
import HistoricalMedicationItem from './HistoricalMedicationItem';
import HistoricalLabBadge from './HistoricalLabBadge';

/**
 * TimelineVisitCard - Expandable Clinical Encounter Card
 * Displays date, consulting doctor, complaints, diagnosis chips, vitals, medicines, and lab orders.
 */
export default function TimelineVisitCard({
  event = {},
  isLatest = false,
  onCopyMedication = () => {},
  activeMedNames = [],
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const visitDate = event.visit_date
    ? new Date(event.visit_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Visit';

  const doctorName = event.doctor_name || 'Dr. T.S.Jeyagowthaman';
  const doctorSpecialty = event.doctor_specialty || 'Consultant Physician';
  const complaints = Array.isArray(event.chief_complaints)
    ? event.chief_complaints
    : typeof event.chief_complaints === 'string' && event.chief_complaints.trim()
    ? [event.chief_complaints]
    : [];

  const diagnosis = event.diagnosis || '';
  const icdCode = event.icd10_code || '';
  const clinicalNotes = event.clinical_notes || '';
  const vitals = event.vitals || {};
  const prescriptions = Array.isArray(event.prescriptions) ? event.prescriptions : [];
  const labOrders = Array.isArray(event.lab_orders) ? event.lab_orders : [];

  // Vitals badge string helper
  const vitalsPills = [];
  if (vitals.bp_systolic && vitals.bp_diastolic) {
    vitalsPills.push({
      label: 'BP',
      val: `${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg`,
      isAlert: vitals.bp_systolic >= 140 || vitals.bp_diastolic >= 90,
    });
  }
  if (vitals.sugar_mg_dl || vitals.grbs_mg_dl) {
    const sVal = vitals.sugar_mg_dl || vitals.grbs_mg_dl;
    vitalsPills.push({
      label: 'Sugar',
      val: `${sVal} mg/dL`,
      isAlert: parseInt(sVal, 10) >= 200,
    });
  }
  if (vitals.weight_kg) {
    vitalsPills.push({
      label: 'Weight',
      val: `${vitals.weight_kg} kg`,
      isAlert: false,
    });
  }
  if (vitals.temperature_f) {
    vitalsPills.push({
      label: 'Temp',
      val: `${vitals.temperature_f}°F`,
      isAlert: parseFloat(vitals.temperature_f) >= 99.5,
    });
  }

  return (
    <div
      className={`rounded-xl border bg-white shadow-xs transition-all duration-200 ${
        isLatest
          ? 'border-teal-300 ring-1 ring-teal-200/60'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header Bar (Clickable Accordion Trigger) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 rounded-t-xl hover:bg-slate-100/60 transition-colors"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-bold text-xs text-slate-900">{visitDate}</span>
          {isLatest && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white uppercase tracking-wider">
              Latest Visit
            </span>
          )}
          <span className="text-xs text-slate-500 truncate">
            • {doctorName} ({doctorSpecialty})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {event.queue_number && (
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 border border-slate-200 rounded">
              Token #{event.queue_number}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Accordion Body Content */}
      {isExpanded && (
        <div className="p-3.5 space-y-3.5 border-t border-slate-100 text-xs">
          {/* Recorded Vitals Row */}
          {vitalsPills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Vitals:
              </span>
              {vitalsPills.map((v, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    v.isAlert
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {v.label}: {v.val}
                </span>
              ))}
            </div>
          )}

          {/* Chief Complaints & Diagnosis */}
          {(complaints.length > 0 || diagnosis) && (
            <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {complaints.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-600">Complaints:</span>
                  {complaints.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200/80"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {diagnosis && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="font-bold text-slate-800">Diagnosis:</span>
                  <span className="font-semibold text-slate-900">{diagnosis}</span>
                  {icdCode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ICD: {icdCode}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Clinical Notes */}
          {clinicalNotes && (
            <p className="text-slate-600 italic text-[11px] leading-relaxed bg-amber-50/50 p-2 rounded border border-amber-200/50">
              &ldquo;{clinicalNotes}&rdquo;
            </p>
          )}

          {/* Prescribed Medications */}
          {prescriptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Prescribed Medications ({prescriptions.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {prescriptions.map((med, idx) => {
                  const mName = med.drug_name || med.name;
                  const isAlreadyInRx = activeMedNames.includes(
                    String(mName || '').toLowerCase().trim()
                  );

                  return (
                    <HistoricalMedicationItem
                      key={idx}
                      med={med}
                      onCopyRx={onCopyMedication}
                      isCopied={isAlreadyInRx}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Lab Orders / Reports */}
          {labOrders.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Lab Investigations ({labOrders.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {labOrders.map((lab, idx) => (
                  <HistoricalLabBadge key={idx} lab={lab} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
