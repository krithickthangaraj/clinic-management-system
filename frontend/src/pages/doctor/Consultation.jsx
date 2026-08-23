import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrescriptionForm } from '../../hooks/usePrescriptionForm';
import { patientService } from '../../services/patientService';
import { prescriptionService } from '../../services/prescriptionService';
import { visitService } from '../../services/visitService';
import { vitalsService } from '../../services/vitalsService';

import ClinicalAssessmentForm from '../../components/prescription/ClinicalAssessmentForm';
import MedicalHistorySidebar from '../../components/prescription/MedicalHistorySidebar';
import TemplateEngineSection from '../../components/prescription/TemplateEngineSection';
import PatientVitalsHeader from '../../components/prescription/PatientVitalsHeader';
import PostPrescriptionRows from '../../components/prescription/PostPrescriptionRows';
import PrescriptionFooter from '../../components/prescription/PrescriptionFooter';
import RXMedicationTable from '../../components/prescription/RXMedicationTable';
import PrescriptionView from '../../components/PrescriptionView';

import './RXConsultation.css';

/**
 * Doctor Consultation Desk
 * Rigid Row-by-Row Clinical Workflow Blueprint
 */
export default function Consultation() {
  const { visitId } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Elapsed consultation timer
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const timerRef = useRef(null);

  // Core Form State & Calculation Hook
  const {
    assessment,
    setAssessment,
    history,
    setHistory,
    addHistoryTag,
    removeHistoryTag,
    medicines,
    setMedicines,
    addDrug,
    duplicateDrug,
    moveDrug,
    removeDrug,
    updateDrug,
    applyMasterDrug,
    loadTemplate,
    planAndBilling,
    setPlanAndBilling,
    addInvestigationTag,
    removeInvestigationTag,
    totalAmount,
  } = usePrescriptionForm();

  // Load visit and existing prescription data
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const visitData = await visitService.getById(visitId);
        if (!mounted) return;
        setVisit(visitData);

        // Fetch comprehensive patient details
        let patientObj = visitData.patient;
        if (!patientObj && visitData.patient_id) {
          try {
            patientObj = await patientService.getById(visitData.patient_id);
          } catch {
            patientObj = {
              id: visitData.patient_id,
              patient_id: visitData.patient_custom_id || `PAT-${visitData.patient_id}`,
              name: visitData.patient_name,
              full_name: visitData.patient_name,
              age: visitData.patient_age,
              age_years: visitData.patient_age,
              gender: visitData.patient_gender,
              phone: visitData.patient_phone,
            };
          }
        }
        if (!patientObj && visitData.patient_name) {
          patientObj = {
            id: visitData.patient_id,
            patient_id: visitData.patient_custom_id || `PAT-${visitData.patient_id}`,
            name: visitData.patient_name,
            full_name: visitData.patient_name,
            age: visitData.patient_age,
            age_years: visitData.patient_age,
            gender: visitData.patient_gender,
            phone: visitData.patient_phone,
          };
        }
        setPatient(patientObj || {});

        // Fetch vitals
        try {
          const vData = await vitalsService.getByVisit(visitId);
          if (mounted && vData) setVitals(vData);
        } catch {
          // Vitals optional
        }

        // Fetch existing full prescription if previously saved
        try {
          const pData = await prescriptionService.getFull(visitId);
          if (mounted && pData) {
            if (pData.assessment) setAssessment(pData.assessment);
            if (pData.history) setHistory(pData.history);
            if (pData.medicines && pData.medicines.length > 0)
              setMedicines(pData.medicines);
            if (pData.plan_and_billing)
              setPlanAndBilling((prev) => ({
                ...prev,
                ...pData.plan_and_billing,
                lab_reports_reviewed: pData.plan_and_billing.lab_reports_reviewed || visitData.laboratory_reports || '',
              }));
          } else if (visitData.laboratory_reports) {
            setPlanAndBilling((prev) => ({
              ...prev,
              lab_reports_reviewed: visitData.laboratory_reports,
            }));
          }
        } catch {
          if (visitData.laboratory_reports) {
            setPlanAndBilling((prev) => ({
              ...prev,
              lab_reports_reviewed: visitData.laboratory_reports,
            }));
          }
        }
        // Calculate actual patient waiting time (frozen for completed patients)
        const calcWait = (v) => {
          if (!v) return 0;
          if (v.waiting_time_minutes !== undefined && v.waiting_time_minutes !== null && v.waiting_time_minutes > 0) {
            return v.waiting_time_minutes;
          }
          if (!v.created_at) return 0;
          const createdAt = new Date(v.created_at).getTime();
          const isDone =
            String(v.status || '').toLowerCase() === 'completed' ||
            String(v.status || '').toLowerCase() === 'consulted' ||
            String(v.status || '').toLowerCase() === 'closed';

          if (isDone) {
            const finishTime = v.completed_at
              ? new Date(v.completed_at).getTime()
              : v.updated_at
              ? new Date(v.updated_at).getTime()
              : createdAt;
            return Math.max(0, Math.floor((finishTime - createdAt) / 60000));
          }

          return Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
        };

        const initialWait = calcWait(visitData);
        setElapsedMinutes(initialWait);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const isDone =
          String(visitData.status || '').toLowerCase() === 'completed' ||
          String(visitData.status || '').toLowerCase() === 'consulted' ||
          String(visitData.status || '').toLowerCase() === 'closed';

        if (!isDone) {
          timerRef.current = setInterval(() => {
            setElapsedMinutes(calcWait(visitData));
          }, 15000);
        }
      } catch (err) {
        console.error('Failed to load consultation data:', err);
        setErrorMessage(
          'Failed to load consultation data. Please check connection.'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visitId, setAssessment, setHistory, setMedicines, setPlanAndBilling]);

  // Inline Vital Update Handler
  const handleUpdateVital = async (field, value) => {
    let nextVitals = { ...vitals, [field]: value };
    const wt = field === 'weight_kg' ? value : nextVitals.weight_kg;
    const ht = field === 'height_cm' ? value : nextVitals.height_cm;
    if (wt && ht && ht > 0) {
      nextVitals.bmi = parseFloat((wt / Math.pow(ht / 100, 2)).toFixed(1));
    }
    setVitals(nextVitals);

    try {
      if (visitId) {
        await vitalsService.updateByVisit(visitId, { [field]: value });
      }
    } catch (err) {
      console.error('Failed to update vital:', err);
    }
  };

  // Master Action Trigger (Save, Print, Status Updates)
  const handleAction = async (actionType) => {
    try {
      setSaving(true);
      setErrorMessage('');

      const validMedicines = medicines.filter(
        (m) => m.drug_name && m.drug_name.trim()
      );
      if (
        validMedicines.length === 0 &&
        actionType !== 'not_visited' &&
        actionType !== 'send_to_lab' &&
        actionType !== 'hold' &&
        actionType !== 'pending' &&
        actionType !== 'save'
      ) {
        setErrorMessage('Please add at least one medication to the prescription.');
        setSaving(false);
        return;
      }

      const payload = {
        visit_id: parseInt(visitId, 10),
        patient_id: patient?.id || visit?.patient_id,
        consultant_name: visit?.consultant_assigned,
        history,
        assessment,
        medicines: validMedicines.map((m, idx) => ({
          ...m,
          s_no: idx + 1,
        })),
        plan_and_billing: {
          ...planAndBilling,
          total_amount: totalAmount,
        },
        status_action: actionType === 'print' ? 'completed' : actionType,
        print_requested: actionType === 'print',
      };

      const result = await prescriptionService.saveFull(payload);

      // Stop consultation waiting timer once saved/completed
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setVisit((prev) => (prev ? { ...prev, status: result.status || 'completed' } : prev));

      if (actionType === 'print') {
        setShowPrescription(true);
      } else if (actionType === 'send_to_lab' || actionType === 'hold') {
        setSuccessToast('Patient sent to Laboratory & placed on Hold. Unblocking Doctor Queue...');
        setTimeout(() => {
          navigate('/doctor/queue');
        }, 900);
      } else if (actionType === 'pending' || actionType === 'save') {
        setSuccessToast('Prescription saved and marked as Pending.');
        setTimeout(() => {
          navigate('/doctor/queue');
        }, 900);
      } else {
        setSuccessToast(`Prescription saved successfully (${result.status})`);
        setTimeout(() => {
          navigate('/doctor/queue');
        }, 1200);
      }
    } catch (err) {
      console.error('Prescription save failed:', err);
      setErrorMessage(
        err.response?.data?.detail ||
          'Failed to save prescription. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Keyboard Shortcuts: Ctrl+Enter (Pending/Save), Alt+N (Add Drug)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to Mark Pending & Save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAction('pending');
      }
      // Alt+N to Add Drug
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addDrug();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, addDrug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-600">
            Loading Consultation Desk...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Printable Prescription Modal & Review Screen */}
      {showPrescription && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible bg-white rounded-2xl shadow-2xl print:shadow-none print:rounded-none p-4 sm:p-6 print:p-0">
            <PrescriptionView
              visitId={visitId}
              visit={visit}
              patient={patient}
              vitals={vitals}
              medicines={medicines}
              chiefComplaints={assessment?.complaints || []}
              diagnosis={assessment?.diagnosis || []}
              history={history}
              examination={assessment?.examination}
              labReportsReviewed={planAndBilling?.lab_reports_reviewed}
              orderedTests={(planAndBilling?.investigations_next_visit || []).map((t) => ({ test_name: t }))}
              procedure={planAndBilling?.procedure}
              referral={planAndBilling?.referral}
              advice={planAndBilling?.advice}
              followUpDate={planAndBilling?.followup_date}
              totalAmount={totalAmount}
              doctorFee={planAndBilling?.doctor_fee}
              doctorName={visit?.consultant_assigned || 'Consultant Physician'}
              onBack={() => setShowPrescription(false)}
              onPrintedAndCompleted={() => {
                setSuccessToast('Prescription printed and visit completed.');
                setTimeout(() => {
                  navigate('/doctor/queue');
                }, 800);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Form Content Container (Full Width Rigid Stack) */}
      <div className="max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 pb-36">
        {/* Toast / Error Alerts */}
        {successToast && (
          <div
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs"
            data-testid="toast-success"
          >
            <span>✓ {successToast}</span>
          </div>
        )}

        {errorMessage && (
          <div
            className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs"
            data-testid="toast-error"
          >
            <span>⚠️ {errorMessage}</span>
            <button
              type="button"
              className="text-rose-600 font-bold ml-2 cursor-pointer"
              onClick={() => setErrorMessage('')}
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. TOP HEADER: Sticky Patient Demographics & Vitals Ribbon */}
        <PatientVitalsHeader
          patient={patient}
          visit={visit}
          vitals={vitals}
          consultantName={visit?.consultant_assigned}
          elapsedWaitMinutes={elapsedMinutes}
          onUpdateVital={handleUpdateVital}
        />

        {/* 2. ROW: Patient Medical History (Left) + Template Engine Section (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <MedicalHistorySidebar
              history={history}
              onAddTag={addHistoryTag}
              onRemoveTag={removeHistoryTag}
            />
          </div>
          <div className="lg:col-span-4">
            <TemplateEngineSection
              medicines={medicines}
              onLoadTemplate={loadTemplate}
              onAddDrug={addDrug}
              onUpdateDrug={updateDrug}
            />
          </div>
        </div>

        {/* 3. ROW 1: Clinical Assessment (Split 50/50) */}
        <ClinicalAssessmentForm
          assessment={assessment}
          onChange={setAssessment}
        />

        {/* 4. ROW 2: RX Medication Table (Full Width - 100% WIDE) */}
        <RXMedicationTable
          medicines={medicines}
          onAddDrug={addDrug}
          onDuplicateDrug={duplicateDrug}
          onMoveDrug={moveDrug}
          onRemoveDrug={removeDrug}
          onUpdateDrug={updateDrug}
          onApplyMasterDrug={applyMasterDrug}
          onToast={setSuccessToast}
        />

        {/* 5. ROWS 3, 4, 5: Labs & Investigations, Clinical Plan & Closing Billing */}
        <PostPrescriptionRows
          planAndBilling={planAndBilling}
          totalAmount={totalAmount}
          laboratoryReports={visit?.laboratory_reports || planAndBilling?.lab_reports_reviewed || ''}
          onChange={setPlanAndBilling}
          onAddInvestigation={addInvestigationTag}
          onRemoveInvestigation={removeInvestigationTag}
        />
      </div>

      {/* 6. ROW 6: Fixed Bottom Viewport Action Bar */}
      <PrescriptionFooter
        totalAmount={totalAmount}
        onAction={handleAction}
        saving={saving}
      />
    </div>
  );
}
