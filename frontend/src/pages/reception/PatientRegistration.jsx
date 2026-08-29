import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { visitService } from '../../services/visitService';
import { vitalsService } from '../../services/vitalsService';
import { validateRegistrationPayload, calculateBmi } from '../../hooks/usePatientCalculations';

import PatientSearch from '../../components/registration/PatientSearch';
import DemographicsCard from '../../components/registration/DemographicsCard';
import VitalsCard from '../../components/registration/VitalsCard';
import ActionFooter from '../../components/registration/ActionFooter';
import FamilyProfileSelectorModal from '../../components/registration/FamilyProfileSelectorModal';
import POSBillingModal from '../../components/billing/POSBillingModal';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  PlusIcon,
  CloseIcon,
  SearchIcon,
} from '../../components/common/MedicalIcons';

import './PatientRegistration.css';

const INITIAL_DEMOGRAPHICS = {
  patient_id: '',
  barcode: '',
  full_name: '',
  name: '',
  dob: '',
  age: '',
  age_format: 'Years',
  gender: 'Male',
  guardian_name: '',
  guardian_relation: '',
  phone_number: '',
  phone: '',
  address: '',
  district: '',
};

const INITIAL_VITALS = {
  weight_kg: '',
  height_cm: '',
  bmi: '',
  blood_pressure: '',
  bp_systolic: '',
  bp_diastolic: '',
  temperature_f: '',
  spo2_percent: '',
  pulse_rate_bpm: '',
  grbs_mg_dl: '',
  consultant_assigned: 'Dr. T.S.Jeyagowthaman',
  remarks: '',
};

export default function PatientRegistration() {
  const navigate = useNavigate();

  // Unified Form State
  const [demographics, setDemographics] = useState(INITIAL_DEMOGRAPHICS);
  const [vitals, setVitals] = useState(INITIAL_VITALS);
  const [validationErrors, setValidationErrors] = useState({});

  // Patient & Visit State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeVisitId, setActiveVisitId] = useState(null);
  const [todayVisits, setTodayVisits] = useState([]);
  const [todayFilter, setTodayFilter] = useState('in_queue');
  const [loadingToday, setLoadingToday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Family Phone Disambiguation State
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [familyPhone, setFamilyPhone] = useState('');

  // POS Billing Modal State
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Fetch today's visits list for reception queue
  const fetchTodayVisits = useCallback(async () => {
    setLoadingToday(true);
    try {
      const list = await visitService.getReceptionToday();
      setTodayVisits(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load today visits:', err);
      setTodayVisits([]);
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayVisits();
    const interval = setInterval(fetchTodayVisits, 12000);
    return () => clearInterval(interval);
  }, [fetchTodayVisits]);

  // Load existing patient details when selected from search or queue
  const handleSelectPatient = async (patientItem) => {
    setErrorMessage('');
    setSuccessBanner(null);
    setValidationErrors({});

    try {
      const pId = patientItem.id;
      const { patient, history } = await patientService.getHistory(pId);
      setSelectedPatient(patient);

      // Populate Demographics
      setDemographics({
        patient_id: patient.patient_id || `PAT-${String(patient.id).padStart(5, '0')}`,
        barcode: patient.barcode || patient.patient_id || '',
        full_name: patient.full_name || patient.name || '',
        name: patient.name || '',
        dob: patient.dob ? String(patient.dob).split('T')[0] : '',
        age: patient.age != null ? String(patient.age) : (patient.age_years != null ? String(patient.age_years) : ''),
        age_format: patient.age_format || 'Years',
        gender: patient.gender || 'Male',
        guardian_name: patient.guardian_name || '',
        guardian_relation: patient.guardian_relation || '',
        phone_number: patient.phone_number || patient.phone || '',
        phone: patient.phone || '',
        address: patient.address || '',
        district: patient.district || '',
      });

      // Populate latest vitals if available
      const latestVisit = history?.[0];
      const latestVitals = latestVisit?.vitals;

      // Only reuse existing visit if it was created TODAY. If it is from yesterday/past, start a new today visit!
      const isTodayDate = (dateVal) => {
        if (!dateVal) return false;
        try {
          const d = new Date(dateVal);
          const now = new Date();
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        } catch {
          return false;
        }
      };

      if (patientItem.visit_id) {
        setActiveVisitId(patientItem.visit_id);
      } else {
        const latestVisitCreated = latestVisit?.visit?.created_at || latestVisit?.created_at;
        if (latestVisit?.visit?.id && isTodayDate(latestVisitCreated)) {
          setActiveVisitId(latestVisit.visit.id);
        } else {
          setActiveVisitId(null);
        }
      }

      if (latestVitals) {
        const tempF =
          latestVitals.temperature_f != null
            ? String(latestVitals.temperature_f)
            : latestVitals.temperature != null
            ? String(((latestVitals.temperature * 9) / 5 + 32).toFixed(1))
            : '';

        setVitals({
          weight_kg: latestVitals.weight_kg != null ? String(latestVitals.weight_kg) : (latestVitals.weight != null ? String(latestVitals.weight) : ''),
          height_cm: latestVitals.height_cm != null ? String(latestVitals.height_cm) : '',
          bmi: latestVitals.bmi != null ? String(latestVitals.bmi) : '',
          blood_pressure: latestVitals.blood_pressure || (latestVitals.bp_systolic && latestVitals.bp_diastolic ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}` : ''),
          bp_systolic: latestVitals.bp_systolic != null ? String(latestVitals.bp_systolic) : '',
          bp_diastolic: latestVitals.bp_diastolic != null ? String(latestVitals.bp_diastolic) : '',
          temperature_f: tempF,
          spo2_percent: latestVitals.spo2_percent != null ? String(latestVitals.spo2_percent) : (latestVitals.spo2 != null ? String(latestVitals.spo2) : ''),
          pulse_rate_bpm: latestVitals.pulse_rate_bpm != null ? String(latestVitals.pulse_rate_bpm) : (latestVitals.pr != null ? String(latestVitals.pr) : ''),
          grbs_mg_dl: latestVitals.grbs_mg_dl != null ? String(latestVitals.grbs_mg_dl) : (latestVitals.sugar != null ? String(latestVitals.sugar) : ''),
          consultant_assigned: latestVitals.consultant_assigned || latestVisit?.visit?.consultant_assigned || 'Dr. T.S.Jeyagowthaman',
          remarks: latestVitals.remarks || '',
        });
      } else {
        setVitals(INITIAL_VITALS);
      }
    } catch (err) {
      console.error('Error loading patient:', err);
      setErrorMessage('Failed to load full patient details.');
    }
  };

  // Reset form to New Patient Mode
  const handleResetToNew = () => {
    setSelectedPatient(null);
    setActiveVisitId(null);
    setDemographics(INITIAL_DEMOGRAPHICS);
    setVitals(INITIAL_VITALS);
    setValidationErrors({});
    setErrorMessage('');
    setSuccessBanner(null);
  };

  // Demographics update handler
  const handleDemographicsChange = async (updatedFields) => {
    setDemographics((prev) => {
      const next = { ...prev, ...updatedFields };
      const errs = { ...validationErrors };
      Object.keys(updatedFields).forEach((key) => {
        if (errs[key]) delete errs[key];
      });
      setValidationErrors(errs);
      return next;
    });

    // Check for existing family member profiles when 10 digits entered
    const enteredPhone = updatedFields.phone_number || updatedFields.phone;
    if (enteredPhone && enteredPhone.length === 10 && !selectedPatient) {
      try {
        const matches = await patientService.getByPhone(enteredPhone);
        if (matches && matches.length > 1) {
          setFamilyPhone(enteredPhone);
          setFamilyProfiles(matches);
          setShowFamilyModal(true);
        }
      } catch (err) {
        console.error('Family phone lookup error:', err);
      }
    }
  };

  // Vitals update handler
  const handleVitalsChange = (updatedFields) => {
    setVitals((prev) => {
      const next = { ...prev, ...updatedFields };
      const errs = { ...validationErrors };
      Object.keys(updatedFields).forEach((key) => {
        if (errs[key]) delete errs[key];
      });
      setValidationErrors(errs);
      return next;
    });
  };

  // Prepare full payload for backend
  const buildPayload = () => {
    const bmiCalculated = calculateBmi(vitals.weight_kg, vitals.height_cm).bmi;

    return {
      // Demographics
      patient_id: demographics.patient_id || undefined,
      barcode: demographics.barcode || undefined,
      full_name: (demographics.full_name || demographics.name || '').trim(),
      name: (demographics.name || demographics.full_name || '').trim(),
      dob: demographics.dob || null,
      age: demographics.age !== '' ? parseInt(demographics.age, 10) : null,
      age_format: demographics.age_format || 'Years',
      gender: demographics.gender || 'Male',
      guardian_name: (demographics.guardian_name || '').trim() || null,
      guardian_relation: demographics.guardian_relation || null,
      phone_number: (demographics.phone_number || demographics.phone || '').trim(),
      phone: (demographics.phone || demographics.phone_number || '').trim(),
      address: (demographics.address || '').trim() || null,
      district: (demographics.district || '').trim() || null,

      // Clinical Vitals
      weight_kg: vitals.weight_kg !== '' ? parseFloat(vitals.weight_kg) : null,
      height_cm: vitals.height_cm !== '' ? parseFloat(vitals.height_cm) : null,
      bmi: bmiCalculated ? parseFloat(bmiCalculated) : null,
      blood_pressure: (vitals.blood_pressure || '').trim() || null,
      bp_systolic: vitals.bp_systolic !== '' ? parseInt(vitals.bp_systolic, 10) : null,
      bp_diastolic: vitals.bp_diastolic !== '' ? parseInt(vitals.bp_diastolic, 10) : null,
      temperature_f: vitals.temperature_f !== '' ? parseFloat(vitals.temperature_f) : null,
      spo2_percent: vitals.spo2_percent !== '' ? parseInt(vitals.spo2_percent, 10) : null,
      pulse_rate_bpm: vitals.pulse_rate_bpm !== '' ? parseInt(vitals.pulse_rate_bpm, 10) : null,
      grbs_mg_dl: vitals.grbs_mg_dl !== '' ? parseInt(vitals.grbs_mg_dl, 10) : null,
      consultant_assigned: vitals.consultant_assigned || 'Dr. T.S.Jeyagowthaman',
      remarks: (vitals.remarks || '').trim() || null,
    };
  };

  // Submit & Save Patient handler
  const handleSave = async () => {
    setErrorMessage('');
    setSuccessBanner(null);

    const payload = buildPayload();
    const { isValid, errors } = validateRegistrationPayload(payload);

    if (!isValid) {
      setValidationErrors(errors);
      setErrorMessage('Please review and resolve the highlighted fields.');
      return null;
    }

    setIsSaving(true);
    try {
      let result = null;

      if (selectedPatient?.id) {
        // Edit Mode / Check-In Mode: Update patient demographics
        const updatedPatient = await patientService.update(selectedPatient.id, payload);
        let vid = activeVisitId;
        let createdNewVisit = false;

        // Ensure active today's visit exists
        if (!vid) {
          const newVisit = await visitService.createForPatient(selectedPatient.id);
          vid = newVisit.id;
          setActiveVisitId(vid);
          createdNewVisit = true;
        }

        // Save vitals on active visit
        const vitalsPayload = {
          visit_id: vid,
          ...payload,
        };
        const updatedVitals = await vitalsService.create(vitalsPayload);

        result = {
          patient: updatedPatient,
          visit: {
            id: vid,
            visit_number: updatedVitals?.visit_number || `Visit #${vid}`,
            status: 'vitals_done',
            created_at: new Date().toISOString(),
          },
          vitals: updatedVitals,
        };

        setSuccessBanner({
          title: createdNewVisit
            ? 'Patient Checked In & Added to Today\'s Queue'
            : 'Patient Record & Vitals Updated',
          patientId: updatedPatient.patient_id || `#${updatedPatient.id}`,
          patientName: updatedPatient.full_name || updatedPatient.name,
          visitNumber: updatedVitals?.visit_number || `Visit #${vid}`,
        });
      } else {
        // New Patient Registration
        result = await patientService.register(payload);

        setSuccessBanner({
          title: 'Patient Registered & Added to Queue',
          patientId: result.patient.patient_id || `#${result.patient.id}`,
          patientName: result.patient.full_name || result.patient.name,
          visitNumber: result.visit.visit_number,
        });
      }

      // Instantly prepend new visit to sidebar queue state
      if (result?.visit && result?.patient) {
        const newVisitItem = {
          id: result.visit.id,
          patient_id: result.patient.id,
          patient_name: result.patient.full_name || result.patient.name,
          patient_phone: result.patient.phone_number || result.patient.phone,
          patient_gender: result.patient.gender,
          visit_number: result.visit.visit_number,
          status: result.visit.status || 'vitals_done',
          created_at: result.visit.created_at || new Date().toISOString(),
        };
        setTodayVisits((prev) => [newVisitItem, ...prev.filter((v) => v.id !== newVisitItem.id)]);
      }

      // Clean reset for next registration
      setDemographics(INITIAL_DEMOGRAPHICS);
      setVitals(INITIAL_VITALS);
      setSelectedPatient(null);
      setActiveVisitId(null);

      await fetchTodayVisits();
      return result;
    } catch (err) {
      console.error('Save failed:', err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Registration failed. Please check inputs.');
      setErrorMessage(msg);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Make Prescription Navigation
  const handleMakePrescription = async () => {
    let vid = activeVisitId;
    if (!vid) {
      const res = await handleSave();
      if (!res) return;
      vid = res.visit?.id;
    }
    if (vid) {
      navigate(`/doctor/consultation/${vid}`);
    }
  };

  // Make Investigation Report Navigation
  const handleMakeInvestigation = async () => {
    let vid = activeVisitId;
    if (!vid) {
      const res = await handleSave();
      if (!res) return;
      vid = res.visit?.id;
    }
    if (vid) {
      navigate(`/lab`);
    }
  };

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to Save
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  return (
    <div className="patient-registration-container">
      {/* Top Application Header */}
      <header className="module-top-header">
        <div className="header-left-meta">
          <button
            type="button"
            className="btn-header-back"
            onClick={() => navigate('/')}
            title="Return to Dashboard"
          >
            Back
          </button>
          <div>
            <h1 className="header-page-title">Patient Registration &amp; Clinical Vitals</h1>
            <p className="header-page-desc">Hospital Outpatient Management System</p>
          </div>
        </div>

        <div className="header-right-meta">
          <button
            type="button"
            className="btn-new-reg-pill"
            onClick={handleResetToNew}
            title="Start fresh new registration"
          >
            <PlusIcon className="w-3.5 h-3.5 inline mr-1" />
            <span>Register New Patient</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Responsive Layout */}
      <div className="registration-grid-layout">
        {/* Left Column: Search & Live Queue */}
        <div className="layout-col-sidebar">
          <PatientSearch
            onSelectPatient={handleSelectPatient}
            selectedPatientId={selectedPatient?.id}
            todayVisits={todayVisits}
            todayFilter={todayFilter}
            onFilterChange={setTodayFilter}
            loadingToday={loadingToday}
          />
        </div>

        {/* Right Column: Unified Demographics & Vitals Form */}
        <main className="layout-col-main">
          {/* Success Banner Alert */}
          {successBanner && (
            <div className="alert-banner-success" role="alert">
              <div className="banner-icon-col">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div className="banner-content-col">
                <h4 className="banner-heading">{successBanner.title}</h4>
                <p className="banner-details">
                  Patient: <strong>{successBanner.patientName}</strong> ({successBanner.patientId}) &bull;{' '}
                  {successBanner.visitNumber}
                </p>
              </div>
              <button
                type="button"
                className="banner-close-btn"
                onClick={() => setSuccessBanner(null)}
                title="Dismiss"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="alert-banner-danger" role="alert">
              <div className="banner-icon-col">
                <AlertCircleIcon className="w-5 h-5" />
              </div>
              <div className="banner-content-col">
                <h4 className="banner-heading">Registration Alert</h4>
                <p className="banner-details">{errorMessage}</p>
              </div>
              <button
                type="button"
                className="banner-close-btn"
                onClick={() => setErrorMessage('')}
                title="Dismiss"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Demographics Card Component */}
          <DemographicsCard
            demographics={demographics}
            onChange={handleDemographicsChange}
            errors={validationErrors}
            isEditMode={Boolean(selectedPatient)}
            onResetToNew={handleResetToNew}
          />

          {/* Clinical Vitals & Visit Card Component */}
          <VitalsCard
            vitals={vitals}
            onChange={handleVitalsChange}
            errors={validationErrors}
          />
        </main>
      </div>

      {/* Sticky Bottom Action Footer Component */}
      <ActionFooter
        onSave={handleSave}
        onMakePrescription={handleMakePrescription}
        onMakeInvestigation={handleMakeInvestigation}
        onCheckout={() => setShowBillingModal(true)}
        isSaving={isSaving}
        hasActiveVisit={Boolean(activeVisitId)}
        isEditMode={Boolean(selectedPatient)}
      />

      {/* Family Member Profile Disambiguation Modal */}
      <FamilyProfileSelectorModal
        isOpen={showFamilyModal}
        phone={familyPhone}
        profiles={familyProfiles}
        onSelectProfile={(p) => {
          setShowFamilyModal(false);
          handleSelectPatient(p);
        }}
        onRegisterNewFamilyMember={() => {
          setShowFamilyModal(false);
          setSelectedPatient(null);
          setActiveVisitId(null);
          setDemographics((prev) => ({
            ...INITIAL_DEMOGRAPHICS,
            phone_number: familyPhone,
            phone: familyPhone,
          }));
        }}
        onClose={() => setShowFamilyModal(false)}
      />

      {/* Point-of-Sale (POS) Master Billing & Thermal Receipt Modal */}
      <POSBillingModal
        isOpen={showBillingModal}
        visitId={activeVisitId}
        onClose={() => setShowBillingModal(false)}
        onSettled={() => {
          fetchTodayVisits();
        }}
      />
    </div>
  );
}
