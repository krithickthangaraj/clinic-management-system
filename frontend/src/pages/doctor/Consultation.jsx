import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { visitService } from '../../services/visitService';
import { vitalsService } from '../../services/vitalsService';
import { prescriptionService } from '../../services/prescriptionService';
import { usePrescriptionForm } from '../../hooks/usePrescriptionForm';

import PatientVitalsHeader from '../../components/prescription/PatientVitalsHeader';
import MedicalHistorySidebar from '../../components/prescription/MedicalHistorySidebar';
import ClinicalAssessmentForm from '../../components/prescription/ClinicalAssessmentForm';
import RXMedicationTable from '../../components/prescription/RXMedicationTable';
import PostPrescriptionRows from '../../components/prescription/PostPrescriptionRows';
import PrescriptionFooter from '../../components/prescription/PrescriptionFooter';
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
        setPatient(visitData.patient || {});

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
              }));
          }
        } catch {
          // No prior prescription
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

    // Start consultation timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMinutes(Math.floor((Date.now() - start) / 60000));
    }, 10000);

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visitId, setAssessment, setHistory, setMedicines, setPlanAndBilling]);

  // Master Action Trigger (Save, Print, Status Updates)
  const handleAction = async (actionType) => {
    try {
      setSaving(true);
      setErrorMessage('');

      const validMedicines = medicines.filter(
        (m) => m.drug_name && m.drug_name.trim()
      );
      if (validMedicines.length === 0 && actionType !== 'not_visited') {
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

      if (actionType === 'print') {
        setShowPrescription(true);
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

  // Keyboard Shortcuts: Ctrl+Enter (Save), Alt+N (Add Drug)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to Save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAction('save');
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
      {/* Printable Prescription Modal */}
      {showPrescription && (
        <PrescriptionView
          visit={visit}
          patient={patient}
          vitals={vitals}
          medicines={medicines}
          advice={planAndBilling.advice}
          followUpDate={planAndBilling.followup_date}
          onClose={() => {
            setShowPrescription(false);
            navigate('/doctor/queue');
          }}
        />
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
        />

        {/* 2. CARD: Patient Medical History (Collapsible Accordion) */}
        <MedicalHistorySidebar
          history={history}
          onAddTag={addHistoryTag}
          onRemoveTag={removeHistoryTag}
        />

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
          onLoadTemplate={loadTemplate}
        />

        {/* 5. ROWS 3, 4, 5: Labs & Investigations, Clinical Plan & Closing Billing */}
        <PostPrescriptionRows
          planAndBilling={planAndBilling}
          totalAmount={totalAmount}
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
