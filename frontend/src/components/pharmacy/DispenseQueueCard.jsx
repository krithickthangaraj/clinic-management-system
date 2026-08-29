import React from 'react';
import { getDailyTokenNumber, formatDoctorDisplayName } from '../../utils/formatters';
import { ClinicalBadge, MonospaceDataTag } from '../ui';

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
      className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer select-none space-y-2.5 active:scale-[0.99] ${
        isSelected
          ? 'bg-teal-50/80 border-teal-600 shadow-xs ring-1 ring-teal-600'
          : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs'
      }`}
      role="button"
      tabIndex={0}
    >
      {/* Top Meta Line: Token + Elapsed + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MonospaceDataTag
            value={`Token #${tokenNo}`}
            variant="teal"
            size="sm"
          />
          <span className="text-[11px] text-slate-500 font-medium">{elapsed}</span>
        </div>

        <ClinicalBadge
          variant={isDispensed ? 'emerald' : 'amber'}
          size="sm"
          isLive={!isDispensed}
        >
          {isDispensed ? 'Dispensed' : 'Pending'}
        </ClinicalBadge>
      </div>

      {/* Patient Demographic Details */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-bold text-slate-900 truncate">
          {patientName}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
          <span>{ageSex}</span>
          <span>•</span>
          <span className="font-mono text-slate-600 font-semibold">{uhid}</span>
        </div>
      </div>

      {/* Footer Info: Doctor & Item count */}
      <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2 text-slate-600">
        <span className="truncate max-w-[170px] font-medium">
          {doctorName}
        </span>
        <ClinicalBadge variant="teal" size="sm" mono>
          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
        </ClinicalBadge>
      </div>
    </div>
  );
}
