import React, { useEffect, useState, useCallback } from 'react';
import { patientService } from '../../services/patientService';
import DrawerHeader from './DrawerHeader';
import VitalsSparklineStrip from './VitalsSparklineStrip';
import TimelineFeed from './TimelineFeed';

const FILTER_TABS = [
  { id: 'ALL', label: 'All Encounters' },
  { id: 'PRESCRIPTIONS', label: 'Prescriptions' },
  { id: 'VITALS', label: 'Vitals Trend' },
  { id: 'LABS', label: 'Lab Results' },
];

/**
 * PatientHistoryDrawer - Master Slide-Over Clinical EMR & Timeline Drawer
 * Renders longitudinal patient trajectory and allows 1-click drug copying to active Rx.
 */
export default function PatientHistoryDrawer({
  isOpen = false,
  onClose = () => {},
  patient = {},
  currentVisitId = null,
  activeMedicines = [],
  onCopyDrugToActiveRx = () => {},
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timelineData, setTimelineData] = useState({
    patientSummary: {},
    vitalsTrajectory: { bp_trend: [], sugar_trend: [], weight_trend: [] },
    timelineEvents: [],
  });

  const patientId = patient?.id || patient?.patient_id;

  // Load and format patient timeline & history data
  const loadHistory = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError('');

      const res = await patientService.getHistory(patientId);
      const rawHistory = Array.isArray(res?.history) ? res.history : [];
      const patientObj = res?.patient || patient || {};

      // Transform rawHistory items into timeline events & trajectories
      const bpTrend = [];
      const sugarTrend = [];
      const weightTrend = [];
      const events = [];

      rawHistory.forEach((item) => {
        const v = item.visit || {};
        const vitals = item.vitals || {};
        const drugs = Array.isArray(item.drugs) ? item.drugs : [];

        const dateStr = v.created_at || v.visit_date || new Date().toISOString();
        const shortDate = dateStr.split('T')[0];

        // Track BP
        if (vitals.bp_systolic && vitals.bp_diastolic) {
          const sys = parseInt(vitals.bp_systolic, 10);
          const dia = parseInt(vitals.bp_diastolic, 10);
          bpTrend.push({
            date: shortDate,
            systolic: sys,
            diastolic: dia,
            alert_level: sys >= 140 || dia >= 90 ? 'CRITICAL' : sys >= 120 ? 'ELEVATED' : 'NORMAL',
          });
        }

        // Track Blood Glucose
        const sugarVal = vitals.grbs_mg_dl || vitals.sugar_mg_dl || vitals.sugar;
        if (sugarVal) {
          const s = parseInt(sugarVal, 10);
          sugarTrend.push({
            date: shortDate,
            value: s,
            type: 'Random',
            alert_level: s >= 200 ? 'CRITICAL' : s >= 140 ? 'ELEVATED' : 'NORMAL',
          });
        }

        // Track Weight & BMI
        const weightVal = vitals.weight_kg || vitals.weight;
        if (weightVal) {
          const w = parseFloat(weightVal);
          const bmiVal = vitals.bmi ? parseFloat(vitals.bmi) : null;
          weightTrend.push({
            date: shortDate,
            weight_kg: w,
            bmi: bmiVal,
          });
        }

        // Add event
        events.push({
          visit_id: v.id,
          visit_date: dateStr,
          doctor_name: v.consultant_assigned || 'Dr. T.S.Jeyagowthaman',
          doctor_specialty: 'Consultant Physician',
          queue_number: v.queue_number || v.token_number,
          chief_complaints: v.chief_complaints || v.symptoms || [],
          diagnosis: v.provisional_diagnosis || v.diagnosis || '',
          icd10_code: v.icd10_code || '',
          clinical_notes: v.clinical_notes || v.remarks || '',
          vitals: {
            bp_systolic: vitals.bp_systolic,
            bp_diastolic: vitals.bp_diastolic,
            temperature_f: vitals.temperature_f || vitals.temperature,
            pulse_bpm: vitals.pulse_rate_bpm || vitals.pr,
            sugar_mg_dl: sugarVal,
            weight_kg: weightVal,
            spo2_percent: vitals.spo2_percent || vitals.spo2,
          },
          prescriptions: drugs.map((d) => ({
            drug_name: d.drug_name || d.name,
            dosage: d.dosage || d.dose || '',
            frequency: d.frequency || '1-0-1',
            duration_days: d.duration_days || d.days || 30,
            timing_notes: d.timing_notes || d.instructions || 'After Food',
          })),
          lab_orders: Array.isArray(v.laboratory_orders)
            ? v.laboratory_orders
            : typeof v.laboratory_reports === 'string' && v.laboratory_reports.trim()
            ? [
                {
                  test_name: 'Laboratory Tests Reviewed',
                  result_summary: v.laboratory_reports,
                  is_abnormal: false,
                },
              ]
            : [],
        });
      });

      // Sort chronological descending (latest first)
      events.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

      setTimelineData({
        patientSummary: {
          patient_id: patientObj.id || patientId,
          full_name: patientObj.full_name || patientObj.name || 'Patient',
          age: patientObj.age || patientObj.age_years,
          gender: patientObj.gender || 'Male',
          uhid: patientObj.patient_id || patientObj.barcode || `UHID-${patientId}`,
          total_visits: events.length,
          first_visit_date: events[events.length - 1]?.visit_date || new Date().toISOString(),
        },
        vitalsTrajectory: {
          bp_trend: bpTrend,
          sugar_trend: sugarTrend,
          weight_trend: weightTrend,
        },
        timelineEvents: events,
      });
    } catch (err) {
      console.error('Failed to load patient history:', err);
      setError('Unable to load clinical history. Please check connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [patientId, patient]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute active medication drug names to prevent duplicate additions
  const activeMedNames = activeMedicines.map((m) =>
    String(m.drug_name || m.name || '').toLowerCase().trim()
  );

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden print:hidden" role="dialog" aria-modal="true">
      {/* Backdrop Overlay with subtle blur */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container (Max 520px wide) */}
      <div className="fixed inset-y-0 right-0 z-[1001] max-w-full sm:max-w-[520px] w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
        {/* 1. Header with Demographics */}
        <DrawerHeader
          patientSummary={timelineData.patientSummary}
          totalVisits={timelineData.timelineEvents.length}
          onClose={onClose}
        />

        {/* 2. Filter Segmented Control */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none text-center ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Scrollable Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 ultra-thin-scrollbar">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading patient longitudinal records...</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-rose-800">⚠️ {error}</p>
              <button
                type="button"
                onClick={loadHistory}
                className="px-3 py-1 bg-rose-600 text-white font-bold rounded-md hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Vitals Sparkline Strip (Only shown on ALL & VITALS tabs) */}
              {(activeFilter === 'ALL' || activeFilter === 'VITALS') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Longitudinal Vitals Trajectory
                    </span>
                  </div>
                  <VitalsSparklineStrip trajectory={timelineData.vitalsTrajectory} />
                </div>
              )}

              {/* Vertical Chronological Timeline Feed */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Encounter Timeline ({timelineData.timelineEvents.length})
                  </span>
                </div>

                <TimelineFeed
                  events={timelineData.timelineEvents}
                  activeFilter={activeFilter}
                  onCopyMedication={onCopyDrugToActiveRx}
                  activeMedNames={activeMedNames}
                />
              </div>
            </>
          )}
        </div>

        {/* 4. Bottom Close Tray */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-700">ESC</kbd> to close drawer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
