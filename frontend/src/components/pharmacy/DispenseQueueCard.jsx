import React from 'react';
import { getDailyTokenNumber, formatDoctorDisplayName } from '../../utils/formatters';

/**
 * DispenseQueueCard - Prescription Token Card in Left Feed
 */
export default function DispenseQueueCard({
  item = {},
  isSelected = false,
  onSelect = () => {},
}) {
  const tokenNo = getDailyTokenNumber(item);
  const patientName = item.patient_name || item.name || 'Patient';
  const uhid = item.patient_id || item.patient_uhid || 'UHID-N/A';
  const ageSex = item.age_sex || `${item.age || '—'} Y / ${item.gender || '—'}`;
  const doctorName = formatDoctorDisplayName(item.consultant_assigned || item.doctor_name);
  const itemCount = item.items_count || (Array.isArray(item.drugs) ? item.drugs.length : 1);
  const status = item.pharmacy_status || item.status || 'pending';
  const isDispensed = String(status).toLowerCase() === 'dispensed' || String(status).toLowerCase() === 'completed';

  // Calculate elapsed time
  const getElapsedString = (dateStr) => {
    if (!dateStr) return 'Just now';
    const min = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
    if (min < 1) return 'Just now';
    if (min === 1) return '1 min ago';
    if (min < 60) return `${min} mins ago`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h ago`;
  };

  const elapsed = getElapsedString(item.prescribed_at || item.created_at);

  return (
    <div
      onClick={() => onSelect(item)}
      className={`p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
        isSelected
          ? 'bg-teal-50/70 border-teal-600 shadow-xs ring-1 ring-teal-600'
          : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs'
      }`}
      role="button"
      tabIndex={0}
    >
      {/* Top Meta Line: Token + Elapsed + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md font-mono font-extrabold text-xs bg-slate-900 text-white">
            Token #{tokenNo}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">{elapsed}</span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            isDispensed
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {isDispensed ? 'Dispensed' : 'Pending'}
        </span>
      </div>

      {/* Patient Demographic Details */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-slate-900 truncate">
          {patientName}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          <span>{ageSex}</span>
          <span>•</span>
          <span className="font-mono">{uhid}</span>
        </div>
      </div>

      {/* Footer Info: Doctor & Item count */}
      <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2 text-slate-600">
        <span className="truncate max-w-[170px]">
          Dr. {doctorName.replace(/^Dr\.?\s*/i, '')}
        </span>
        <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
        </span>
      </div>
    </div>
  );
}
