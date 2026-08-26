import React from 'react';
import TimelineVisitCard from './TimelineVisitCard';

/**
 * TimelineFeed - Chronological Vertical Spine Wrapper
 * Renders patient visit cards connected by a teal spine with node pulses.
 */
export default function TimelineFeed({
  events = [],
  activeFilter = 'ALL',
  onCopyMedication = () => {},
  activeMedNames = [],
}) {
  // Filter events based on activeFilter
  const filteredEvents = events.filter((ev) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PRESCRIPTIONS') {
      return Array.isArray(ev.prescriptions) && ev.prescriptions.length > 0;
    }
    if (activeFilter === 'VITALS') {
      return (
        ev.vitals &&
        (ev.vitals.bp_systolic ||
          ev.vitals.sugar_mg_dl ||
          ev.vitals.weight_kg ||
          ev.vitals.temperature_f)
      );
    }
    if (activeFilter === 'LABS') {
      return Array.isArray(ev.lab_orders) && ev.lab_orders.length > 0;
    }
    return true;
  });

  if (filteredEvents.length === 0) {
    return (
      <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          No Historical Records Found
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          {activeFilter === 'ALL'
            ? 'First Clinical Encounter — No prior visit records exist for this patient.'
            : `No historical records match the "${activeFilter}" filter.`}
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
      {filteredEvents.map((event, index) => {
        const isLatest = index === 0;

        return (
          <div key={event.visit_id || index} className="relative group">
            {/* Timeline Spine Node Marker */}
            <div
              className={`absolute -left-[19px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white transition-transform ${
                isLatest
                  ? 'bg-teal-600 ring-4 ring-teal-100'
                  : 'bg-slate-400 group-hover:bg-teal-500'
              }`}
            />

            {/* Visit Card */}
            <TimelineVisitCard
              event={event}
              isLatest={isLatest}
              onCopyMedication={onCopyMedication}
              activeMedNames={activeMedNames}
            />
          </div>
        );
      })}
    </div>
  );
}
