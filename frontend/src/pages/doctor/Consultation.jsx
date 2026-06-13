import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MedicineEntry from '../../components/MedicineEntry';
import PrescriptionView from '../../components/PrescriptionView';
import { masterService } from '../../services/masterService';
import { patientHistoryService } from '../../services/patientHistoryService';
import { patientService } from '../../services/patientService';
import { prescriptionService } from '../../services/prescriptionService';
import { templateService } from '../../services/templateService';
import { testService } from '../../services/testService';
import { visitRelationsService } from '../../services/visitRelationsService';
import { visitService } from '../../services/visitService';
import { vitalsService } from '../../services/vitalsService';
import {
  buildTemplatePayload,
  cleanMedicines,
  cleanTests,
  cleanVitals,
} from '../../utils/templatePayload';
import './Consultation.css';

const FREQUENCY_OPTIONS = [
  { label: 'OD (1-0-0)', value: '1-0-0' },
  { label: 'BD (1-0-1)', value: '1-0-1' },
  { label: 'TDS (1-1-1)', value: '1-1-1' },
  { label: 'QID (1-1-1-1)', value: '1-1-1-1' },
  { label: 'HS (0-0-1)', value: '0-0-1' },
  { label: 'SOS', value: '0-0-0' },
  { label: 'QW', value: '0-0-0' },
];
const DOSAGE_OPTIONS = [
  '250mg',
  '500mg',
  '750mg',
  '1000mg',
  '5ml',
  '10ml',
  '1 tablet',
  '2 tablets',
];
const FREQUENT_TESTS = [
  'CBC',
  'RBS (Random Blood Sugar)',
  'Lipid Profile',
  'HbA1c',
  'X-Ray Chest',
  'ECG',
];

export default function Consultation() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  // Consultation data - using new DB-driven system
  const [visitComplaints, setVisitComplaints] = useState([]); // Array of { id, complaint_id, custom_complaint, complaint: { name } }
  const [visitDiagnosis, setVisitDiagnosis] = useState([]); // Array of { id, diagnosis_id, custom_diagnosis, diagnosis: { name } }
  const [visitAdvice, setVisitAdvice] = useState([]); // Array of advice IDs/chips
  const [complaintInput, setComplaintInput] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [adviceInput, setAdviceInput] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [complaintsMaster, setComplaintsMaster] = useState([]);
  const [diagnosisMaster, setDiagnosisMaster] = useState([]);
  const [adviceMaster, setAdviceMaster] = useState([]);
  const [labTestsMaster, setLabTestsMaster] = useState([]);
  const [masterEditing, setMasterEditing] = useState(null);
  const [masterEditValue, setMasterEditValue] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [selectedFollowUpOption, setSelectedFollowUpOption] = useState(null); // 'tomorrow' | '2days' | '3days' | '1week' | '1month' | 'custom' | null
  const [followUpTimeUnit, setFollowUpTimeUnit] = useState('day'); // 'day' | 'week' | 'month'
  const [medicines, setMedicines] = useState([]);
  const [orderedTests, setOrderedTests] = useState([]);
  const [newTestName, setNewTestName] = useState('');
  const [newTestType] = useState('Lab'); // Fixed to Lab only, no dropdown needed

  // Patient history dropdowns
  const [historyDropdown, setHistoryDropdown] = useState(null); // 'allergy' | 'family' | 'surgical' | 'past' | 'visit' | null
  const [allergyHistory, setAllergyHistory] = useState([]);
  const [familyHistory, setFamilyHistory] = useState([]);
  const [surgicalHistory, setSurgicalHistory] = useState([]);
  const [pastHistory, setPastHistory] = useState([]);
  const [newHistoryValue, setNewHistoryValue] = useState('');

  // Fees
  const [payment, setPayment] = useState(null);
  const [doctorFee, setDoctorFee] = useState('');

  // Template states
  const [templates, setTemplates] = useState([]);
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Past history
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Timer: starts when page loads, stops when Finish
  const [timerSec, setTimerSec] = useState(0);
  const timerRef = useRef(null);

  // Editable vitals
  const [editingVital, setEditingVital] = useState(null);
  const [vitalTemp, setVitalTemp] = useState({
    bp_s: '',
    bp_d: '',
    temp: '',
    wt: '',
    ht: '',
    sugar: '',
    pr: '',
    spo2: '',
  });

  useEffect(() => {
    loadData();
    loadTemplates();
    // Load all master data (complaints, diagnosis, advice, tests) from DB
    // This data is shared across ALL patients - when doctor adds something for one patient,
    // it becomes available for all future patients
    loadMasters();
  }, [visitId]);

  // Also reload masters when component mounts (for first patient of the day)
  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    try {
      const [complaints, diagnosis, advice, labTests] = await Promise.all([
        masterService.listComplaints().catch(() => []),
        masterService.listDiagnosis().catch(() => []),
        masterService.listAdvice().catch(() => []),
        masterService.listLabTests('', 'Lab').catch(() => []),
      ]);
      setComplaintsMaster(complaints);
      setDiagnosisMaster(diagnosis);
      setAdviceMaster(advice);
      setLabTestsMaster(labTests);
    } catch (err) {
      console.error('Failed to load masters:', err);
    }
  };

  const updateMasterList = (type, updater) => {
    if (type === 'complaints') setComplaintsMaster((items) => updater(items));
    else if (type === 'diagnosis')
      setDiagnosisMaster((items) => updater(items));
    else if (type === 'advice') setAdviceMaster((items) => updater(items));
    else if (type === 'tests') setLabTestsMaster((items) => updater(items));
  };

  const handleUpdateMasterItem = async (type, item) => {
    const nextName = masterEditValue.trim();
    if (!nextName) return;

    try {
      let updated;
      if (type === 'complaints')
        updated = await masterService.updateComplaint(item.id, nextName);
      else if (type === 'diagnosis')
        updated = await masterService.updateDiagnosis(item.id, nextName);
      else if (type === 'advice')
        updated = await masterService.updateAdvice(item.id, nextName);
      else
        updated = await masterService.updateLabTest(
          item.id,
          nextName,
          item.test_type || 'Lab'
        );

      updateMasterList(type, (items) =>
        items.map((current) => (current.id === item.id ? updated : current))
      );
      setMasterEditing(null);
      setMasterEditValue('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update item');
    }
  };

  const handleDeleteMasterItem = async (type, item) => {
    if (!confirm(`Delete "${item.name}" from saved items?`)) return;

    try {
      if (type === 'complaints') await masterService.deleteComplaint(item.id);
      else if (type === 'diagnosis')
        await masterService.deleteDiagnosis(item.id);
      else if (type === 'advice') await masterService.deleteAdvice(item.id);
      else await masterService.deleteLabTest(item.id);

      updateMasterList(type, (items) =>
        items.filter((current) => current.id !== item.id)
      );
      if (type === 'advice')
        setVisitAdvice((ids) => ids.filter((id) => id !== item.id));
      if (type === 'tests') {
        setOrderedTests((items) =>
          items.filter((test) => test.test_name !== item.name)
        );
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete item');
    }
  };

  const renderMasterItem = (type, item, selected, onToggle) => {
    const editKey = `${type}-${item.id}`;
    const isEditing = masterEditing === editKey;

    return (
      <div
        key={item.id}
        className={`master-item-row ${selected ? 'selected' : ''}`}
      >
        {isEditing ? (
          <input
            type="text"
            value={masterEditValue}
            onChange={(e) => setMasterEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateMasterItem(type, item);
              if (e.key === 'Escape') {
                setMasterEditing(null);
                setMasterEditValue('');
              }
            }}
            className="master-edit-input"
            autoFocus
          />
        ) : (
          <button type="button" className="master-item-btn" onClick={onToggle}>
            {item.name}
          </button>
        )}
        <div className="master-item-actions">
          {isEditing ? (
            <>
              <button
                type="button"
                className="master-action-btn"
                onClick={() => handleUpdateMasterItem(type, item)}
              >
                Save
              </button>
              <button
                type="button"
                className="master-action-btn muted"
                onClick={() => {
                  setMasterEditing(null);
                  setMasterEditValue('');
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="master-action-btn"
                onClick={() => {
                  setMasterEditing(editKey);
                  setMasterEditValue(item.name);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="master-action-btn danger"
                onClick={() => handleDeleteMasterItem(type, item)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const loadPatientHistory = async (type) => {
    if (!visit?.patient_id) return;
    try {
      const data = await patientHistoryService.get(visit.patient_id, type);
      if (type === 'allergy') setAllergyHistory(data);
      else if (type === 'family') setFamilyHistory(data);
      else if (type === 'surgical') setSurgicalHistory(data);
      else if (type === 'past') setPastHistory(data);
    } catch (err) {
      console.error(`Failed to load ${type} history:`, err);
    }
  };

  // Load all patient history on visit load to show counts
  const loadAllPatientHistory = async (patientId) => {
    if (!patientId) return;
    try {
      const [allergy, family, surgical, past] = await Promise.all([
        patientHistoryService.get(patientId, 'allergy').catch(() => []),
        patientHistoryService.get(patientId, 'family').catch(() => []),
        patientHistoryService.get(patientId, 'surgical').catch(() => []),
        patientHistoryService.get(patientId, 'past').catch(() => []),
      ]);
      setAllergyHistory(allergy);
      setFamilyHistory(family);
      setSurgicalHistory(surgical);
      setPastHistory(past);
    } catch (err) {
      console.error('Failed to load patient history:', err);
    }
  };

  // Set in_consultation when opening a waiting visit
  useEffect(() => {
    if (!visit || !visitId) return;
    if (visit.status === 'vitals_done') {
      visitService
        .update(visitId, { status: 'in_consultation' })
        .then(() => {
          setVisit((p) => (p ? { ...p, status: 'in_consultation' } : p));
        })
        .catch(() => {});
    }
  }, [visit?.id, visit?.status, visitId]);

  // Timer: start on mount, clear on unmount or when finished
  useEffect(() => {
    if (!visit) return;
    timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visit?.id]);

  const loadTemplates = async () => {
    try {
      const data = await templateService.list();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const getVitalsSnapshotForTemplate = () => {
    const snapshot = { ...(vitals || {}) };
    if (editingVital === 'bp') {
      const systolic = parseInt(vitalTemp.bp_s, 10);
      const diastolic = parseInt(vitalTemp.bp_d, 10);
      snapshot.bp_systolic = isNaN(systolic) ? null : systolic;
      snapshot.bp_diastolic = isNaN(diastolic) ? null : diastolic;
    } else if (editingVital === 'ht') {
      const value = parseFloat(vitalTemp.ht);
      snapshot.height_cm = isNaN(value) ? null : value;
    } else if (editingVital === 'wt') {
      const value = parseFloat(vitalTemp.wt);
      snapshot.weight = isNaN(value) ? null : value;
    } else if (editingVital === 'sugar') {
      const value = parseFloat(vitalTemp.sugar);
      snapshot.sugar = isNaN(value) ? null : value;
    } else if (editingVital === 'temp') {
      const value = parseFloat(vitalTemp.temp);
      snapshot.temperature = isNaN(value) ? null : value;
    } else if (editingVital === 'pr') {
      const value = parseInt(vitalTemp.pr, 10);
      snapshot.pr = isNaN(value) ? null : value;
    } else if (editingVital === 'spo2') {
      const value = parseInt(vitalTemp.spo2, 10);
      snapshot.spo2 = isNaN(value) ? null : value;
    }
    return snapshot;
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const complaintsForTemplate = visitComplaints.map(
        (c) => c.custom_complaint || c.complaint?.name || ''
      );
      const diagnosisForTemplate = visitDiagnosis
        .map((d) => d.custom_diagnosis || d.diagnosis?.name || '')
        .join(', ');
      const adviceForTemplate = visitAdvice
        .map((id) => {
          const a = adviceMaster.find((ad) => ad.id === id);
          return a ? a.name : '';
        })
        .filter(Boolean)
        .join(', ');

      const payload = buildTemplatePayload({
        name: newTemplateName.trim(),
        complaints: [...complaintsForTemplate, complaintInput],
        diagnosis: [diagnosisForTemplate, diagnosisInput],
        advice: [adviceForTemplate, adviceInput],
        medicines,
        vitals: getVitalsSnapshotForTemplate(),
        tests: [...orderedTests, { test_name: newTestName, test_type: 'Lab' }],
        followUpDate,
        followUpNotes,
      });
      await templateService.create(payload);
      alert('Template saved successfully!');
      setNewTemplateName('');
      setShowTemplateModal(false);
      loadTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
      alert('Failed to save template');
    }
  };

  const handleLoadTemplate = async (template) => {
    if (
      !confirm(
        `Load template "${template.name}"? This will overwrite current entries.`
      )
    )
      return;

    try {
      // Load complaints from template (legacy JSON format)
      const templateComplaints =
        typeof template.chief_complaints === 'string'
          ? JSON.parse(template.chief_complaints || '[]')
          : template.chief_complaints || [];

      // Clear existing complaints
      for (const c of visitComplaints) {
        try {
          await visitRelationsService.removeComplaint(visitId, c.id);
        } catch {}
      }

      // Add template complaints - try to find in master first, otherwise add as custom
      for (const name of templateComplaints) {
        if (!name) continue;
        const existing = complaintsMaster.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) {
          await visitRelationsService
            .addComplaint(visitId, existing.id, null)
            .catch(() => {});
        } else {
          await visitRelationsService
            .addComplaint(visitId, null, name)
            .catch(() => {});
        }
      }
      const updatedComplaints =
        await visitRelationsService.getComplaints(visitId);
      setVisitComplaints(updatedComplaints);

      // Clear existing diagnosis
      for (const d of visitDiagnosis) {
        try {
          await visitRelationsService.removeDiagnosis(visitId, d.id);
        } catch {}
      }

      // Load diagnosis (legacy string format - can be comma-separated)
      if (template.diagnosis) {
        const diagnoses =
          typeof template.diagnosis === 'string'
            ? template.diagnosis.split(',').map((d) => d.trim())
            : [template.diagnosis];
        for (const diag of diagnoses) {
          if (!diag) continue;
          const existing = diagnosisMaster.find(
            (d) => d.name.toLowerCase() === diag.toLowerCase()
          );
          if (existing) {
            await visitRelationsService
              .addDiagnosis(visitId, existing.id, null)
              .catch(() => {});
          } else {
            await visitRelationsService
              .addDiagnosis(visitId, null, diag)
              .catch(() => {});
          }
        }
      }
      const updatedDiagnosis = await visitRelationsService.getDiagnosis(visitId);
      setVisitDiagnosis(updatedDiagnosis);

      // Load medicines
      const templateDrugs =
        typeof template.drugs === 'string'
          ? JSON.parse(template.drugs || '[]')
          : template.drugs || [];
      setMedicines(cleanMedicines(templateDrugs));

      const templateTests =
        typeof template.tests === 'string'
          ? JSON.parse(template.tests || '[]')
          : template.tests || [];
      setOrderedTests(cleanTests(templateTests));

      if (template.follow_up_date) {
        setFollowUpDate(String(template.follow_up_date).slice(0, 10));
        setSelectedFollowUpOption('custom');
      } else {
        setFollowUpDate('');
        setSelectedFollowUpOption(null);
      }
      setFollowUpNotes(template.follow_up_notes || '');

      const templateVitals =
        typeof template.vitals === 'string'
          ? JSON.parse(template.vitals || '{}')
          : template.vitals || null;
      if (templateVitals && Object.keys(templateVitals).length > 0) {
        const cleanedVitals = cleanVitals(templateVitals);
        try {
          const updatedVitals = await vitalsService.updateByVisit(
            visitId,
            cleanedVitals
          );
          setVitals(updatedVitals);
        } catch (err) {
          console.error('Failed to apply template vitals:', err);
          setVitals((current) => ({ ...(current || {}), ...cleanedVitals }));
        }
      }

      // Load advice
      if (template.advice) {
        const advices =
          typeof template.advice === 'string'
            ? template.advice.split(',').map((a) => a.trim())
            : [template.advice];
        const adviceIds = [];
        for (const adv of advices) {
          if (!adv) continue;
          const existing = adviceMaster.find(
            (a) => a.name.toLowerCase() === adv.toLowerCase()
          );
          if (existing) {
            adviceIds.push(existing.id);
          } else {
            try {
              const created = await masterService.createAdvice(adv);
              adviceIds.push(created.id);
              await loadMasters();
            } catch {}
          }
        }
        setVisitAdvice(adviceIds);
      } else {
        setVisitAdvice([]);
      }

      alert('Template loaded successfully!');
    } catch (err) {
      console.error('Failed to load template:', err);
      alert('Failed to load template. Please try again.');
    }
  };

  const loadHistory = async () => {
    if (!visit?.patient_id) return;
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const data = await patientService.getHistory(visit.patient_id);
      setHistoryData(data);
    } catch (err) {
      setHistoryData({ patient: null, history: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [
        visitData,
        vitalsData,
        complaintsData,
        diagnosisData,
        paymentData,
      ] = await Promise.all([
        visitService.getById(visitId),
        vitalsService.getByVisit(visitId).catch(() => null),
        visitRelationsService.getComplaints(visitId).catch(() => []),
        visitRelationsService.getDiagnosis(visitId).catch(() => []),
        visitRelationsService.getPayment(visitId).catch(() => null),
      ]);

      setVisit(visitData);
      setVitals(vitalsData);
      setVisitComplaints(complaintsData);
      setVisitDiagnosis(diagnosisData);

      // Load all patient history to show counts
      if (visitData.patient_id) {
        loadAllPatientHistory(visitData.patient_id);
      }
      if (paymentData) {
        setPayment(paymentData);
        setDoctorFee(String(paymentData.doctor_fee || 0));
      } else {
        setDoctorFee('');
      }

      if (visitData.follow_up_date) {
        const loadedDate = new Date(visitData.follow_up_date)
          .toISOString()
          .split('T')[0];
        setFollowUpDate(loadedDate);
        // Detect which quick option matches (if any)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followUp = new Date(loadedDate);
        followUp.setHours(0, 0, 0, 0);
        const diffDays = Math.round((followUp - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) setSelectedFollowUpOption('tomorrow');
        else if (diffDays === 2) setSelectedFollowUpOption('2days');
        else if (diffDays === 3) setSelectedFollowUpOption('3days');
        else if (diffDays === 7) setSelectedFollowUpOption('1week');
        else if (diffDays >= 28 && diffDays <= 31)
          setSelectedFollowUpOption('1month');
        else setSelectedFollowUpOption('custom');
      }
      setFollowUpNotes(visitData.follow_up_notes || '');

      const [prescription, tests] = await Promise.all([
        prescriptionService.getByVisit(visitId).catch(() => ({ drugs: [] })),
        testService.getByVisit(visitId).catch(() => []),
      ]);

      if (prescription.drugs) {
        setMedicines(prescription.drugs);
      }
      setOrderedTests(tests);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Complaints: add from input with + icon
  const handleAddComplaint = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const inputValue = complaintInput.trim();
    if (!inputValue) return;

    try {
      // Step 1: Create or get complaint from master
      let complaintId = null;
      try {
        const created = await masterService.createComplaint(inputValue);
        complaintId = created.id;
      } catch (masterErr) {
        console.error('Master service error:', masterErr);
        const errorMsg =
          masterErr.response?.data?.detail ||
          masterErr.message ||
          'Failed to create complaint in master';
        throw new Error(`Master: ${errorMsg}`);
      }

      // Step 2: Add complaint to visit
      try {
        await visitRelationsService.addComplaint(visitId, complaintId, null);
      } catch (visitErr) {
        console.error('Visit relations error:', visitErr);
        const errorMsg =
          visitErr.response?.data?.detail ||
          visitErr.message ||
          'Failed to add complaint to visit';
        throw new Error(`Visit: ${errorMsg}`);
      }

      // Step 3: Refresh data
      const updated = await visitRelationsService.getComplaints(visitId);
      setVisitComplaints(updated);
      setComplaintInput('');
      // Reload masters to include the newly created item for next patient
      await loadMasters();
    } catch (err) {
      console.error('Failed to add complaint - Full error:', err);
      const errorMessage =
        err.message || err.response?.data?.detail || 'Unknown error occurred';
      alert(`Failed to add complaint: ${errorMessage}`);
    }
  };

  const handleRemoveComplaint = async (complaintId) => {
    try {
      await visitRelationsService.removeComplaint(visitId, complaintId);
      const updated = await visitRelationsService.getComplaints(visitId);
      setVisitComplaints(updated);
    } catch (err) {
      console.error('Failed to remove complaint:', err);
    }
  };

  // Diagnosis: same pattern
  const handleAddDiagnosis = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const inputValue = diagnosisInput.trim();
    if (!inputValue) return;

    try {
      let diagnosisId = null;
      try {
        const created = await masterService.createDiagnosis(inputValue);
        diagnosisId = created.id;
      } catch (masterErr) {
        console.error('Master service error:', masterErr);
        const errorMsg =
          masterErr.response?.data?.detail ||
          masterErr.message ||
          'Failed to create diagnosis in master';
        throw new Error(`Master: ${errorMsg}`);
      }

      try {
        await visitRelationsService.addDiagnosis(visitId, diagnosisId, null);
      } catch (visitErr) {
        console.error('Visit relations error:', visitErr);
        const errorMsg =
          visitErr.response?.data?.detail ||
          visitErr.message ||
          'Failed to add diagnosis to visit';
        throw new Error(`Visit: ${errorMsg}`);
      }

      const updated = await visitRelationsService.getDiagnosis(visitId);
      setVisitDiagnosis(updated);
      setDiagnosisInput('');
      // Reload masters to include the newly created item for next patient
      await loadMasters();
    } catch (err) {
      console.error('Failed to add diagnosis - Full error:', err);
      const errorMessage =
        err.message || err.response?.data?.detail || 'Unknown error occurred';
      alert(`Failed to add diagnosis: ${errorMessage}`);
    }
  };

  const handleRemoveDiagnosis = async (diagnosisId) => {
    try {
      await visitRelationsService.removeDiagnosis(visitId, diagnosisId);
      const updated = await visitRelationsService.getDiagnosis(visitId);
      setVisitDiagnosis(updated);
    } catch (err) {
      console.error('Failed to remove diagnosis:', err);
    }
  };

  // Advice: add from master
  const handleAddAdvice = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const inputValue = adviceInput.trim();
    if (!inputValue) return;

    try {
      const created = await masterService.createAdvice(inputValue);
      setVisitAdvice([...visitAdvice, created.id]);
      setAdviceInput('');
      // Reload masters to include the newly created item for next patient
      await loadMasters();
    } catch (err) {
      console.error('Failed to add advice - Full error:', err);
      const errorMessage =
        err.response?.data?.detail || err.message || 'Unknown error occurred';
      alert(`Failed to add advice: ${errorMessage}`);
    }
  };

  // Patient history: add new entry
  const handleAddHistory = async (type) => {
    if (!newHistoryValue.trim() || !visit?.patient_id) return;
    try {
      await patientHistoryService.create(
        visit.patient_id,
        type,
        newHistoryValue.trim()
      );
      await loadPatientHistory(type);
      // Reload all history to update counts
      await loadAllPatientHistory(visit.patient_id);
      setNewHistoryValue('');
    } catch (err) {
      console.error(`Failed to add ${type} history:`, err);
    }
  };

  // Patient history: toggle checkbox
  const handleToggleHistory = async (historyId, type, isActive) => {
    try {
      await patientHistoryService.toggle(historyId, type, isActive);
      await loadPatientHistory(type);
      // Reload all history to update counts
      if (visit?.patient_id) {
        await loadAllPatientHistory(visit.patient_id);
      }
    } catch (err) {
      console.error(`Failed to toggle ${type} history:`, err);
    }
  };

  // Add test handler
  const handleAddTest = async () => {
    const inputValue = newTestName.trim();
    if (!inputValue) return;

    try {
      // Check if already in ordered tests
      if (
        orderedTests.find(
          (t) => t.test_name.toLowerCase() === inputValue.toLowerCase()
        )
      ) {
        setNewTestName('');
        return;
      }

      // Check if exists in master
      const existing = labTestsMaster.find(
        (t) =>
          t.name.toLowerCase() === inputValue.toLowerCase() &&
          t.test_type === 'Lab'
      );
      if (!existing) {
        // Create new test in master
        try {
          await masterService.createLabTest(inputValue, 'Lab');
          // Reload masters to include the newly created test for next patient
          await loadMasters();
        } catch (err) {
          console.error('Failed to create lab test:', err);
          const errorMsg =
            err.response?.data?.detail ||
            err.message ||
            'Failed to create test in master';
          throw new Error(`Master: ${errorMsg}`);
        }
      }

      // Add to ordered tests
      setOrderedTests([
        ...orderedTests,
        { test_name: inputValue, test_type: 'Lab', status: 'ordered' },
      ]);
      setNewTestName('');
    } catch (err) {
      console.error('Failed to add test - Full error:', err);
      const errorMessage =
        err.message || err.response?.data?.detail || 'Unknown error occurred';
      alert(`Failed to add test: ${errorMessage}`);
    }
  };

  const saveVital = async (payload) => {
    try {
      const updated = await vitalsService.updateByVisit(visitId, payload);
      setVitals(updated);
      setEditingVital(null);
    } catch (e) {
      console.error('Failed to update vitals', e);
    }
  };

  const handleVitalBlur = (which) => {
    if (which === 'bp') {
      const s = parseInt(vitalTemp.bp_s, 10);
      const d = parseInt(vitalTemp.bp_d, 10);
      if (!isNaN(s) || !isNaN(d))
        saveVital({
          bp_systolic: isNaN(s) ? null : s,
          bp_diastolic: isNaN(d) ? null : d,
        });
    } else if (which === 'temp') {
      const v = parseFloat(vitalTemp.temp);
      if (!isNaN(v)) saveVital({ temperature: v });
    } else if (which === 'wt') {
      const v = parseFloat(vitalTemp.wt);
      if (!isNaN(v)) saveVital({ weight: v });
    } else if (which === 'ht') {
      const v = parseFloat(vitalTemp.ht);
      if (!isNaN(v)) saveVital({ height_cm: v });
    } else if (which === 'sugar') {
      const v = parseFloat(vitalTemp.sugar);
      if (!isNaN(v)) saveVital({ sugar: v });
    } else if (which === 'pr') {
      const v = parseInt(vitalTemp.pr, 10);
      if (!isNaN(v)) saveVital({ pr: v });
    } else if (which === 'spo2') {
      const v = parseInt(vitalTemp.spo2, 10);
      if (!isNaN(v)) saveVital({ spo2: v });
    }
    setEditingVital(null);
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (vitals?.weight && vitals?.height_cm) {
      const bmi =
        parseFloat(vitals.weight) /
        Math.pow(parseFloat(vitals.height_cm) / 100, 2);
      return bmi.toFixed(1);
    }
    return null;
  };

  const handleSave = async (statusToSet = 'completed') => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSaving(true);
    try {
      // Save visit update (advice as text for now, follow-up)
      const adviceText = visitAdvice
        .map((id) => {
          const a = adviceMaster.find((ad) => ad.id === id);
          return a ? a.name : '';
        })
        .filter(Boolean)
        .join(', ');

      await visitService.update(visitId, {
        advice: adviceText,
        follow_up_date: followUpDate || null,
        follow_up_notes: followUpNotes,
        status: statusToSet,
      });

      // Save prescription
      if (medicines.length > 0) {
        await prescriptionService.create({
          visit_id: parseInt(visitId),
          drugs: medicines,
        });
      }

      // Save tests
      if (orderedTests.length > 0) {
        const newTests = orderedTests.filter((t) => !t.id);
        for (const test of newTests) {
          await testService.create({
            visit_id: parseInt(visitId),
            test_name: test.test_name,
            test_type: test.test_type,
          });
        }
      }

      // Save payment
      const docFee = parseFloat(doctorFee) || 0;
      if (payment) {
        await visitRelationsService.updatePayment(visitId, {
          doctor_fee: docFee,
          lab_fee: 0,
          total: docFee,
        });
      } else if (docFee > 0) {
        await visitRelationsService.createPayment(
          visitId,
          docFee,
          0,
          'pending',
          null
        );
      }

      if (statusToSet === 'completed') {
        setShowPrescription(true);
      } else {
        alert('Visit marked as pending. You can continue editing later.');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPending = () => {
    handleSave('pending');
  };

  if (loading) {
    return (
      <div className="loading-container">Loading consultation details...</div>
    );
  }

  if (showPrescription) {
    return (
      <PrescriptionView
        visitId={visitId}
        visit={visit}
        vitals={vitals}
        medicines={medicines}
        chiefComplaints={visitComplaints.map(
          (c) => c.custom_complaint || c.complaint?.name || ''
        )}
        orderedTests={orderedTests}
        diagnosis={visitDiagnosis
          .map((d) => d.custom_diagnosis || d.diagnosis?.name || '')
          .join(', ')}
        advice={visitAdvice
          .map((id) => {
            const a = adviceMaster.find((ad) => ad.id === id);
            return a ? a.name : '';
          })
          .filter(Boolean)
          .join(', ')}
        followUpDate={followUpDate}
        doctorFee={doctorFee}
        onBack={() => setShowPrescription(false)}
        onPrinted={() => navigate('/doctor/queue?filter=pending')}
      />
    );
  }

  return (
    <div className="consultation-layout">
      {/* Sticky Top Bar: Patient & Vitals Unified */}
      <div className="patient-sticky-header">
        <div className="header-top">
          <button
            onClick={() => navigate('/doctor/queue')}
            className="btn-icon-back"
          >
            ←
          </button>
          <div className="patient-main-info">
            <h2>{visit?.patient_name}</h2>
            <span className="patient-meta">
              {visit?.patient_age != null && `${visit.patient_age}Y`}
              {visit?.patient_age_months != null &&
                visit.patient_age_months > 0 &&
                ` ${visit.patient_age_months}M`}
              {visit?.patient_age != null && ' • '}
              {visit?.patient_gender?.toUpperCase()} • {visit?.visit_number}
            </span>
          </div>
          <div className="header-history-section">
            <span className="history-section-label">🧬 History</span>
            <div className="header-history-buttons">
              <button
                type="button"
                className={`history-btn-modern ${historyDropdown === 'allergy' ? 'active' : ''}`}
                onClick={() => {
                  if (historyDropdown === 'allergy') {
                    setHistoryDropdown(null);
                  } else {
                    setHistoryDropdown('allergy');
                    loadPatientHistory('allergy');
                  }
                }}
              >
                <span className="history-icon">⚠️</span>
                <span>Allergy</span>
                {allergyHistory.filter((h) => h.is_active).length > 0 && (
                  <span className="history-count-badge">
                    {allergyHistory.filter((h) => h.is_active).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`history-btn-modern ${historyDropdown === 'family' ? 'active' : ''}`}
                onClick={() => {
                  if (historyDropdown === 'family') {
                    setHistoryDropdown(null);
                  } else {
                    setHistoryDropdown('family');
                    loadPatientHistory('family');
                  }
                }}
              >
                <span className="history-icon">👨‍👩‍👧‍👦</span>
                <span>Family</span>
                {familyHistory.filter((h) => h.is_active).length > 0 && (
                  <span className="history-count-badge">
                    {familyHistory.filter((h) => h.is_active).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`history-btn-modern ${historyDropdown === 'surgical' ? 'active' : ''}`}
                onClick={() => {
                  if (historyDropdown === 'surgical') {
                    setHistoryDropdown(null);
                  } else {
                    setHistoryDropdown('surgical');
                    loadPatientHistory('surgical');
                  }
                }}
              >
                <span className="history-icon">🏥</span>
                <span>Surgical</span>
                {surgicalHistory.filter((h) => h.is_active).length > 0 && (
                  <span className="history-count-badge">
                    {surgicalHistory.filter((h) => h.is_active).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`history-btn-modern ${historyDropdown === 'past' ? 'active' : ''}`}
                onClick={() => {
                  if (historyDropdown === 'past') {
                    setHistoryDropdown(null);
                  } else {
                    setHistoryDropdown('past');
                    loadPatientHistory('past');
                  }
                }}
              >
                <span className="history-icon">📋</span>
                <span>Past</span>
                {pastHistory.filter((h) => h.is_active).length > 0 && (
                  <span className="history-count-badge">
                    {pastHistory.filter((h) => h.is_active).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`history-btn-modern ${historyDropdown === 'visit' ? 'active' : ''}`}
                onClick={() => {
                  if (historyDropdown === 'visit') {
                    setHistoryDropdown(null);
                    setShowHistory(false);
                  } else {
                    setHistoryDropdown('visit');
                    loadHistory();
                  }
                }}
              >
                <span className="history-icon">📅</span>
                <span>Visits</span>
                {historyData?.history?.length > 0 && (
                  <span className="history-count-badge">
                    {historyData.history.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="header-actions">
            <span className="consult-timer" title="Consultation time">
              {String(Math.floor(timerSec / 60)).padStart(2, '0')}:
              {String(timerSec % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {vitals && (
          <div className="vitals-strip-single">
            {/* Single line: Height, Weight, BMI, RBS, BP, Temp, PR, SpO2 */}
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('ht');
                setVitalTemp((t) => ({
                  ...t,
                  ht: String(vitals.height_cm ?? ''),
                }));
              }}
            >
              <span className="vital-icon">📏</span>
              <span className="label-compact">HT</span>
              {editingVital === 'ht' ? (
                <input
                  className="value-inline-compact"
                  type="number"
                  step="0.1"
                  value={vitalTemp.ht}
                  onChange={(e) =>
                    setVitalTemp((t) => ({ ...t, ht: e.target.value }))
                  }
                  onBlur={() => handleVitalBlur('ht')}
                  onKeyDown={(e) => e.key === 'Enter' && handleVitalBlur('ht')}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="cm"
                />
              ) : (
                <span className="value-compact">
                  {vitals.height_cm != null ? `${vitals.height_cm}cm` : '—'}
                </span>
              )}
            </div>
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('wt');
                setVitalTemp((t) => ({
                  ...t,
                  wt: String(vitals.weight ?? ''),
                }));
              }}
            >
              <span className="vital-icon">⚖️</span>
              <span className="label-compact">WT</span>
              {editingVital === 'wt' ? (
                <input
                  className="value-inline-compact"
                  type="number"
                  step="0.1"
                  value={vitalTemp.wt}
                  onChange={(e) =>
                    setVitalTemp((t) => ({ ...t, wt: e.target.value }))
                  }
                  onBlur={() => handleVitalBlur('wt')}
                  onKeyDown={(e) => e.key === 'Enter' && handleVitalBlur('wt')}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="kg"
                />
              ) : (
                <span className="value-compact">
                  {vitals.weight != null ? `${vitals.weight}kg` : '—'}
                </span>
              )}
            </div>
            <div className="vital-pill-compact vital-pill-bmi-compact">
              <span className="vital-icon">📊</span>
              <span className="label-compact">BMI</span>
              <span className="value-compact">{calculateBMI() ?? '—'}</span>
            </div>
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('sugar');
                setVitalTemp((t) => ({
                  ...t,
                  sugar: String(vitals.sugar ?? ''),
                }));
              }}
            >
              <span className="vital-icon">🍬</span>
              <span className="label-compact">RBS</span>
              {editingVital === 'sugar' ? (
                <input
                  className="value-inline-compact"
                  type="number"
                  step="0.1"
                  value={vitalTemp.sugar}
                  onChange={(e) =>
                    setVitalTemp((t) => ({ ...t, sugar: e.target.value }))
                  }
                  onBlur={() => handleVitalBlur('sugar')}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleVitalBlur('sugar')
                  }
                  onClick={(e) => e.stopPropagation()}
                  placeholder="mg/dL"
                />
              ) : (
                <span className="value-compact">
                  {vitals.sugar != null ? `${vitals.sugar}` : '—'}
                </span>
              )}
            </div>
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('bp');
                setVitalTemp((t) => ({
                  ...t,
                  bp_s: String(vitals.bp_systolic ?? ''),
                  bp_d: String(vitals.bp_diastolic ?? ''),
                }));
              }}
            >
              <span className="vital-icon">💓</span>
              <span className="label-compact">BP</span>
              {editingVital === 'bp' ? (
                <span
                  className="value-edit-compact"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    value={vitalTemp.bp_s}
                    onChange={(e) =>
                      setVitalTemp((t) => ({ ...t, bp_s: e.target.value }))
                    }
                    onBlur={() => handleVitalBlur('bp')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleVitalBlur('bp')
                    }
                    placeholder="S"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    value={vitalTemp.bp_d}
                    onChange={(e) =>
                      setVitalTemp((t) => ({ ...t, bp_d: e.target.value }))
                    }
                    onBlur={() => handleVitalBlur('bp')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleVitalBlur('bp')
                    }
                    placeholder="D"
                  />
                </span>
              ) : (
                <span className="value-compact">
                  {vitals.bp_systolic ?? '—'}/{vitals.bp_diastolic ?? '—'}
                </span>
              )}
            </div>
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('temp');
                setVitalTemp((t) => ({
                  ...t,
                  temp: String(vitals.temperature ?? ''),
                }));
              }}
            >
              <span className="vital-icon">🌡️</span>
              <span className="label-compact">TEMP</span>
              {editingVital === 'temp' ? (
                <input
                  className="value-inline-compact"
                  type="number"
                  step="0.1"
                  value={vitalTemp.temp}
                  onChange={(e) =>
                    setVitalTemp((t) => ({ ...t, temp: e.target.value }))
                  }
                  onBlur={() => handleVitalBlur('temp')}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleVitalBlur('temp')
                  }
                  onClick={(e) => e.stopPropagation()}
                  placeholder="°C"
                />
              ) : (
                <span className="value-compact">
                  {vitals.temperature != null ? `${vitals.temperature}°C` : '—'}
                </span>
              )}
            </div>
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('pr');
                setVitalTemp((t) => ({ ...t, pr: String(vitals.pr ?? '') }));
              }}
            >
              <span className="vital-icon">💗</span>
              <span className="label-compact">PR</span>
              {editingVital === 'pr' ? (
                <input
                  className="value-inline-compact"
                  type="number"
                  value={vitalTemp.pr}
                  onChange={(e) =>
                    setVitalTemp((t) => ({ ...t, pr: e.target.value }))
                  }
                  onBlur={() => handleVitalBlur('pr')}
                  onKeyDown={(e) => e.key === 'Enter' && handleVitalBlur('pr')}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="bpm"
                />
              ) : (
                <span className="value-compact">
                  {vitals.pr != null ? `${vitals.pr}` : '—'}
                </span>
              )}
            </div>
            <div
              className="vital-pill-compact"
              onClick={() => {
                setEditingVital('spo2');
                setVitalTemp((t) => ({
                  ...t,
                  spo2: String(vitals.spo2 ?? ''),
                }));
              }}
            >
              <span className="vital-icon">🫁</span>
              <span className="label-compact">SpO₂</span>
              {editingVital === 'spo2' ? (
                <input
                  className="value-inline-compact"
                  type="number"
                  value={vitalTemp.spo2}
                  onChange={(e) =>
                    setVitalTemp((t) => ({ ...t, spo2: e.target.value }))
                  }
                  onBlur={() => handleVitalBlur('spo2')}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleVitalBlur('spo2')
                  }
                  onClick={(e) => e.stopPropagation()}
                  placeholder="%"
                />
              ) : (
                <span className="value-compact">
                  {vitals.spo2 != null ? `${vitals.spo2}%` : '—'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* History Floating Panel */}
        {historyDropdown && historyDropdown !== 'visit' && (
          <>
            <div
              className="history-panel-overlay"
              onClick={() => setHistoryDropdown(null)}
            ></div>
            <div className="history-floating-panel">
              <div className="history-panel-header">
                <h4>
                  {historyDropdown === 'allergy'
                    ? '⚠️ Allergy History'
                    : historyDropdown === 'family'
                      ? '👨‍👩‍👧‍👦 Family History'
                      : historyDropdown === 'surgical'
                        ? '🏥 Surgical History'
                        : '📋 Past History'}
                </h4>
                <button
                  type="button"
                  onClick={() => setHistoryDropdown(null)}
                  className="btn-close-panel"
                >
                  ✕
                </button>
              </div>
              <div className="history-panel-body">
                {/* Add New Input at Top */}
                <div className="history-add-new-top">
                  <input
                    type="text"
                    value={newHistoryValue}
                    onChange={(e) => setNewHistoryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddHistory(historyDropdown);
                      }
                    }}
                    placeholder={`Add new ${historyDropdown === 'allergy' ? 'allergy' : historyDropdown === 'family' ? 'family history' : historyDropdown === 'surgical' ? 'surgical history' : 'past history'}...`}
                    className="modern-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddHistory(historyDropdown)}
                    className="btn-add-history"
                    disabled={!newHistoryValue.trim()}
                  >
                    +
                  </button>
                </div>

                {/* Checkbox List */}
                <div className="history-checkbox-list">
                  {(historyDropdown === 'allergy'
                    ? allergyHistory
                    : historyDropdown === 'family'
                      ? familyHistory
                      : historyDropdown === 'surgical'
                        ? surgicalHistory
                        : pastHistory
                  ).map((item) => (
                    <label
                      key={item.id}
                      className="history-checkbox-item-modern"
                    >
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) =>
                          handleToggleHistory(
                            item.id,
                            historyDropdown,
                            e.target.checked
                          )
                        }
                      />
                      <span className="history-checkbox-label">
                        {item.value}
                      </span>
                    </label>
                  ))}
                  {(historyDropdown === 'allergy'
                    ? allergyHistory
                    : historyDropdown === 'family'
                      ? familyHistory
                      : historyDropdown === 'surgical'
                        ? surgicalHistory
                        : pastHistory
                  ).length === 0 && (
                    <div className="history-empty-state">
                      No{' '}
                      {historyDropdown === 'allergy'
                        ? 'allergies'
                        : historyDropdown === 'family'
                          ? 'family history'
                          : historyDropdown === 'surgical'
                            ? 'surgical history'
                            : 'past history'}{' '}
                      recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="consultation-content">
        <div className="template-corner">
          <button
            type="button"
            className={`template-corner-toggle ${templatePanelOpen ? 'active' : ''}`}
            onClick={() => setTemplatePanelOpen((open) => !open)}
            title="Templates"
          >
            <span>📋</span>
            <span>Templates</span>
            <strong>{templates.length}</strong>
          </button>
          {templatePanelOpen && (
            <div className="template-corner-panel">
              <div className="template-select-group">
                <select
                  onChange={(e) => {
                    const t = templates.find(
                      (temp) => temp.id === parseInt(e.target.value)
                    );
                    if (t) handleLoadTemplate(t);
                    e.target.value = '';
                    setTemplatePanelOpen(false);
                  }}
                  className="template-select"
                >
                  <option value="">Load Template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="template-actions">
                <button
                  type="button"
                  onClick={() => {
                    setTemplatePanelOpen(false);
                    setShowTemplateModal(true);
                  }}
                  className="btn-outline-primary"
                >
                  Save Current
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/doctor/template/new');
                  }}
                  className="btn-outline-success"
                >
                  Create New
                </button>
              </div>
              {templates.length > 0 && (
                <div className="template-list">
                  <p className="template-list-label">Edit Templates:</p>
                  {templates.map((t) => (
                    <div key={t.id} className="template-list-item">
                      <span>{t.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/doctor/template/${t.id}`);
                        }}
                        className="btn-small"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="consultation-sections">
          {/* Row 1: Complaints + Diagnosis */}
          <div className="consultation-row clinical-row-primary">
            {/* Complaints — Left side */}
            <section className="consult-card compact-card single-row-section">
              <h3>Chief Complaints</h3>

              {/* Selected complaints for this visit */}
              {visitComplaints.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {visitComplaints.map((c) => (
                    <span key={c.id} className="complaint-chip active">
                      {c.custom_complaint || c.complaint?.name || ''}
                      <button
                        type="button"
                        onClick={() => handleRemoveComplaint(c.id)}
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* All available complaints from DB - clickable chips */}
              {complaintsMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">
                    Available Complaints (Click to add):
                  </div>
                  <div className="chips-grid master-chips-grid">
                    {complaintsMaster
                      .filter(
                        (c) =>
                          !visitComplaints.find(
                            (vc) => vc.complaint_id === c.id
                          )
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={async () => {
                            try {
                              await visitRelationsService.addComplaint(
                                visitId,
                                c.id,
                                null
                              );
                              const updated =
                                await visitRelationsService.getComplaints(
                                  visitId
                                );
                              setVisitComplaints(updated);
                            } catch (err) {
                              console.error('Failed to add complaint:', err);
                              alert(
                                'Failed to add complaint. Please try again.'
                              );
                            }
                          }}
                          title="Click to add"
                        >
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Input for new complaint */}
              <div className="complaint-input-group">
                <input
                  type="text"
                  placeholder="Type new complaint..."
                  value={complaintInput}
                  onChange={(e) => setComplaintInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComplaint(e);
                    }
                  }}
                  list="complaint-suggestions"
                  className="modern-input"
                />
                <datalist id="complaint-suggestions">
                  {complaintsMaster.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                {complaintInput.trim() && (
                  <button
                    type="button"
                    onClick={(e) => handleAddComplaint(e)}
                    className="btn-add-complaint"
                    title="Add new to master & visit"
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(true)}
                  className="btn-show-all"
                  title="Show all complaints"
                >
                  📋
                </button>
              </div>
            </section>

            {/* Diagnosis — Right side of first row */}
            <section className="consult-card compact-card single-row-section">
              <h3>Diagnosis</h3>

              {/* Selected diagnosis for this visit */}
              {visitDiagnosis.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {visitDiagnosis.map((d) => (
                    <span key={d.id} className="complaint-chip active">
                      {d.custom_diagnosis || d.diagnosis?.name || ''}
                      <button
                        type="button"
                        onClick={() => handleRemoveDiagnosis(d.id)}
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* All available diagnosis from DB - clickable chips */}
              {diagnosisMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">
                    Available Diagnosis (Click to add):
                  </div>
                  <div className="chips-grid master-chips-grid">
                    {diagnosisMaster
                      .filter(
                        (d) =>
                          !visitDiagnosis.find((vd) => vd.diagnosis_id === d.id)
                      )
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={async () => {
                            try {
                              await visitRelationsService.addDiagnosis(
                                visitId,
                                d.id,
                                null
                              );
                              const updated =
                                await visitRelationsService.getDiagnosis(
                                  visitId
                                );
                              setVisitDiagnosis(updated);
                            } catch (err) {
                              console.error('Failed to add diagnosis:', err);
                              alert(
                                'Failed to add diagnosis. Please try again.'
                              );
                            }
                          }}
                          title="Click to add"
                        >
                          {d.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Input for new diagnosis */}
              <div className="complaint-input-group">
                <input
                  type="text"
                  placeholder="Type new diagnosis..."
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDiagnosis(e);
                    }
                  }}
                  list="diagnosis-suggestions"
                  className="modern-input"
                />
                <datalist id="diagnosis-suggestions">
                  {diagnosisMaster.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
                {diagnosisInput.trim() && (
                  <button
                    type="button"
                    onClick={(e) => handleAddDiagnosis(e)}
                    className="btn-add-complaint"
                    title="Add new to master & visit"
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDiagnosisModal(true)}
                  className="btn-show-all"
                  title="Show all diagnosis"
                >
                  📋
                </button>
              </div>
            </section>
          </div>

          {/* Row 2: Doctor Advice + Lab Tests */}
          <div className="consultation-row clinical-row-secondary">
            {/* Doctor Advice — Left side */}
            <section className="consult-card compact-card single-row-section">
              <h3>Doctor's Advice</h3>

              {/* Selected advice for this visit */}
              {visitAdvice.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {visitAdvice.map((id) => {
                    const a = adviceMaster.find((ad) => ad.id === id);
                    if (!a) return null;
                    return (
                      <span key={id} className="complaint-chip active">
                        {a.name}
                        <button
                          type="button"
                          onClick={() =>
                            setVisitAdvice(
                              visitAdvice.filter((aid) => aid !== id)
                            )
                          }
                          className="chip-remove"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* All available advice from DB - clickable chips */}
              {adviceMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">
                    Available Advice (Click to add):
                  </div>
                  <div className="chips-grid master-chips-grid">
                    {adviceMaster
                      .filter((a) => !visitAdvice.includes(a.id))
                      .map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={() => {
                            setVisitAdvice([...visitAdvice, a.id]);
                          }}
                          title="Click to add"
                        >
                          {a.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Input for new advice */}
              <div className="complaint-input-group">
                <input
                  type="text"
                  placeholder="Type new advice..."
                  value={adviceInput}
                  onChange={(e) => setAdviceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAdvice(e);
                    }
                  }}
                  list="advice-suggestions"
                  className="modern-input"
                />
                <datalist id="advice-suggestions">
                  {adviceMaster.map((a) => (
                    <option key={a.id} value={a.name} />
                  ))}
                </datalist>
                {adviceInput.trim() && (
                  <button
                    type="button"
                    onClick={(e) => handleAddAdvice(e)}
                    className="btn-add-complaint"
                    title="Add new to master & visit"
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdviceModal(true)}
                  className="btn-show-all"
                  title="Show all advice"
                >
                  📋
                </button>
              </div>
            </section>

            {/* Lab Tests — Right side */}
            <section className="consult-card compact-card single-row-section">
              <h3>Investigations / Tests</h3>

              {/* Selected tests for this visit */}
              {orderedTests.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {orderedTests.map((test, i) => (
                    <span key={i} className="complaint-chip active">
                      {test.test_name}
                      <button
                        type="button"
                        onClick={() =>
                          setOrderedTests(
                            orderedTests.filter((_, idx) => idx !== i)
                          )
                        }
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* All available tests from DB - clickable chips */}
              {labTestsMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">
                    Available Tests (Click to add):
                  </div>
                  <div className="chips-grid master-chips-grid">
                    {labTestsMaster
                      .filter((t) => t.test_type === 'Lab')
                      .filter(
                        (t) =>
                          !orderedTests.find((ot) => ot.test_name === t.name)
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={() => {
                            setOrderedTests([
                              ...orderedTests,
                              {
                                test_name: t.name,
                                test_type: 'Lab',
                                status: 'ordered',
                              },
                            ]);
                          }}
                          title="Click to add"
                        >
                          {t.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Frequent tests as quick chips (only if not in master yet) */}
              {FREQUENT_TESTS.filter((t) =>
                [
                  'CBC',
                  'RBS (Random Blood Sugar)',
                  'Lipid Profile',
                  'HbA1c',
                ].includes(t)
              ).filter(
                (test) =>
                  !orderedTests.find((t) => t.test_name === test) &&
                  !labTestsMaster.find((t) => t.name === test)
              ).length > 0 && (
                <div className="frequent-tests-chips">
                  <span className="frequent-tests-label">
                    Quick Add Common Tests:
                  </span>
                  {FREQUENT_TESTS.filter((t) =>
                    [
                      'CBC',
                      'RBS (Random Blood Sugar)',
                      'Lipid Profile',
                      'HbA1c',
                    ].includes(t)
                  )
                    .filter(
                      (test) =>
                        !orderedTests.find((t) => t.test_name === test) &&
                        !labTestsMaster.find((t) => t.name === test)
                    )
                    .map((test) => (
                      <button
                        key={test}
                        type="button"
                        className="frequent-test-chip"
                        onClick={() => {
                          setOrderedTests([
                            ...orderedTests,
                            {
                              test_name: test,
                              test_type: 'Lab',
                              status: 'ordered',
                            },
                          ]);
                        }}
                      >
                        {test}
                      </button>
                    ))}
                </div>
              )}

              {/* Input for new test */}
              <div className="test-entry-group">
                <input
                  type="text"
                  placeholder="Type new test..."
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  list="test-suggestions"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newTestName.trim()) {
                      e.preventDefault();
                      e.stopPropagation();
                      await handleAddTest();
                    }
                  }}
                />
                <datalist id="test-suggestions">
                  {labTestsMaster
                    .filter((t) => t.test_type === 'Lab')
                    .map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                </datalist>
                {newTestName.trim() && (
                  <button
                    type="button"
                    className="btn-add-circle"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await handleAddTest();
                    }}
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  className="btn-show-all"
                  title="Show all tests"
                >
                  📋
                </button>
              </div>
            </section>
          </div>

          {/* Medications */}
          <section className="consult-card medications-section">
            <h3>Medications</h3>
            <MedicineEntry
              onAdd={(m) => setMedicines([...medicines, m])}
              frequencyOptions={FREQUENCY_OPTIONS}
              dosageOptions={DOSAGE_OPTIONS}
            />
            {medicines.length > 0 && (
              <div className="medicines-table-container">
                <table className="modern-med-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Drug Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Days</th>
                      <th>Qty</th>
                      <th>Instructions</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((med, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="font-bold">{med.drug_name}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.number_of_days}</td>
                        <td>
                          <span className="qty-pill">{med.quantity}</span>
                        </td>
                        <td>{med.instructions || '—'}</td>
                        <td className="text-right med-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setMedicines(
                                medicines.filter((_, idx) => idx !== i)
                              )
                            }
                            className="btn-table-delete"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Follow-up & Fees */}
          <div className="followup-fees-grid">
            {/* Follow-up Section - Redesigned */}
            <section className="consult-card followup-card">
              <h3>Follow-up</h3>
              <div className="followup-content">
                {/* Quick Date Options */}
                <div className="followup-quick-options">
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === 'tomorrow' ? 'active' : ''}`}
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFollowUpDate(tomorrow.toISOString().split('T')[0]);
                      setSelectedFollowUpOption('tomorrow');
                    }}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '2days' ? 'active' : ''}`}
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 2);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                      setSelectedFollowUpOption('2days');
                    }}
                  >
                    2 Days
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '3days' ? 'active' : ''}`}
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 3);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                      setSelectedFollowUpOption('3days');
                    }}
                  >
                    3 Days
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '1week' ? 'active' : ''}`}
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                      setSelectedFollowUpOption('1week');
                    }}
                  >
                    1 Week
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '1month' ? 'active' : ''}`}
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + 1);
                      setFollowUpDate(date.toISOString().split('T')[0]);
                      setSelectedFollowUpOption('1month');
                    }}
                  >
                    1 Month
                  </button>
                </div>

                {/* Date Adjuster with Plus/Minus */}
                <div className="followup-date-adjuster">
                  <div className="followup-adjuster-controls">
                    <div className="followup-time-unit-selector">
                      <label>Adjust by:</label>
                      <select
                        value={followUpTimeUnit}
                        onChange={(e) => setFollowUpTimeUnit(e.target.value)}
                        className="modern-select"
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                      </select>
                    </div>

                    <div className="followup-adjuster-buttons">
                      <button
                        type="button"
                        className="followup-adjust-btn followup-minus-btn"
                        onClick={() => {
                          if (!followUpDate) {
                            // If no date set, start from today
                            setFollowUpDate(
                              new Date().toISOString().split('T')[0]
                            );
                            return;
                          }
                          const date = new Date(followUpDate);
                          if (followUpTimeUnit === 'day') {
                            date.setDate(date.getDate() - 1);
                          } else if (followUpTimeUnit === 'week') {
                            date.setDate(date.getDate() - 7);
                          } else if (followUpTimeUnit === 'month') {
                            date.setMonth(date.getMonth() - 1);
                          }
                          setFollowUpDate(date.toISOString().split('T')[0]);
                          setSelectedFollowUpOption('custom');
                        }}
                        title={`Subtract 1 ${followUpTimeUnit}`}
                      >
                        −
                      </button>

                      <div className="followup-date-display-inline">
                        {followUpDate ? (
                          <span className="followup-date-value">
                            {new Date(followUpDate).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        ) : (
                          <span className="followup-date-placeholder">
                            Select date
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="followup-adjust-btn followup-plus-btn"
                        onClick={() => {
                          const baseDate = followUpDate
                            ? new Date(followUpDate)
                            : new Date();
                          const date = new Date(baseDate);
                          if (followUpTimeUnit === 'day') {
                            date.setDate(date.getDate() + 1);
                          } else if (followUpTimeUnit === 'week') {
                            date.setDate(date.getDate() + 7);
                          } else if (followUpTimeUnit === 'month') {
                            date.setMonth(date.getMonth() + 1);
                          }
                          setFollowUpDate(date.toISOString().split('T')[0]);
                          setSelectedFollowUpOption('custom');
                        }}
                        title={`Add 1 ${followUpTimeUnit}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Custom Date Picker */}
                  <div className="followup-custom-date-picker">
                    <label>Or pick specific date:</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => {
                        setFollowUpDate(e.target.value);
                        setSelectedFollowUpOption('custom');
                      }}
                      className="modern-input"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    placeholder="Specific notes for follow-up..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    rows="2"
                    className="modern-textarea"
                  />
                </div>
              </div>
            </section>

            {/* Fees Section - Simplified */}
            <section className="consult-card fees-card">
              <h3>Doctor Fee</h3>
              <div className="fees-form-simple">
                <div className="form-group">
                  <label>Consultation Fee</label>
                  <div className="fee-input-wrapper">
                    <span className="fee-currency">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={doctorFee}
                      onChange={(e) => {
                        setDoctorFee(e.target.value);
                        const df = parseFloat(e.target.value) || 0;
                        if (payment) {
                          visitRelationsService
                            .updatePayment(visitId, {
                              doctor_fee: df,
                              lab_fee: 0,
                              total: df,
                            })
                            .then((p) => setPayment(p));
                        }
                      }}
                      placeholder="0.00"
                      className="modern-input fee-input"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Final Actions */}
          <div className="consult-actions-bar">
            <button
              onClick={handleMarkPending}
              className="btn-secondary"
              disabled={saving}
            >
              Mark Pending
            </button>
            <button
              onClick={() => handleSave('completed')}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Complete & Print'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Save Consultation Template</h3>
            <p>
              This will save current complaints, diagnosis, medications, and
              advice.
            </p>
            <div className="form-group">
              <label>Template Name (e.g., Fever Follow-up)</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter name..."
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn-back"
              >
                Cancel
              </button>
              <button onClick={handleSaveTemplate} className="btn-primary">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Modal */}
      {showComplaintModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowComplaintModal(false)}
        >
          <div className="master-modal" onClick={(e) => e.stopPropagation()}>
            <div className="master-modal-header">
              <h3>All Complaints</h3>
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            <div className="master-modal-body">
              {complaintsMaster.map((c) =>
                renderMasterItem(
                  'complaints',
                  c,
                  Boolean(
                    visitComplaints.find((vc) => vc.complaint_id === c.id)
                  ),
                  async () => {
                    const existing = visitComplaints.find(
                      (vc) => vc.complaint_id === c.id
                    );
                    if (existing) {
                      await handleRemoveComplaint(existing.id);
                    } else {
                      await visitRelationsService.addComplaint(
                        visitId,
                        c.id,
                        null
                      );
                      const updated =
                        await visitRelationsService.getComplaints(visitId);
                      setVisitComplaints(updated);
                    }
                  }
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis Modal */}
      {showDiagnosisModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDiagnosisModal(false)}
        >
          <div className="master-modal" onClick={(e) => e.stopPropagation()}>
            <div className="master-modal-header">
              <h3>All Diagnosis</h3>
              <button
                type="button"
                onClick={() => setShowDiagnosisModal(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            <div className="master-modal-body">
              {diagnosisMaster.map((d) =>
                renderMasterItem(
                  'diagnosis',
                  d,
                  Boolean(
                    visitDiagnosis.find((vd) => vd.diagnosis_id === d.id)
                  ),
                  async () => {
                    const existing = visitDiagnosis.find(
                      (vd) => vd.diagnosis_id === d.id
                    );
                    if (existing) {
                      await handleRemoveDiagnosis(existing.id);
                    } else {
                      await visitRelationsService.addDiagnosis(
                        visitId,
                        d.id,
                        null
                      );
                      const updated =
                        await visitRelationsService.getDiagnosis(visitId);
                      setVisitDiagnosis(updated);
                    }
                  }
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advice Modal */}
      {showAdviceModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAdviceModal(false)}
        >
          <div className="master-modal" onClick={(e) => e.stopPropagation()}>
            <div className="master-modal-header">
              <h3>All Advice</h3>
              <button
                type="button"
                onClick={() => setShowAdviceModal(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            <div className="master-modal-body">
              {adviceMaster.map((a) =>
                renderMasterItem(
                  'advice',
                  a,
                  visitAdvice.includes(a.id),
                  () => {
                    if (visitAdvice.includes(a.id)) {
                      setVisitAdvice(visitAdvice.filter((id) => id !== a.id));
                    } else {
                      setVisitAdvice([...visitAdvice, a.id]);
                    }
                  }
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tests Modal */}
      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="master-modal" onClick={(e) => e.stopPropagation()}>
            <div className="master-modal-header">
              <h3>All Investigation / Tests</h3>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            <div className="master-modal-body">
              {labTestsMaster
                .filter((t) => t.test_type === 'Lab')
                .map((t) =>
                  renderMasterItem(
                    'tests',
                    t,
                    Boolean(orderedTests.find((ot) => ot.test_name === t.name)),
                    () => {
                      const existing = orderedTests.find(
                        (ot) => ot.test_name === t.name
                      );
                      if (existing) {
                        setOrderedTests(
                          orderedTests.filter((ot) => ot.test_name !== t.name)
                        );
                      } else {
                        setOrderedTests([
                          ...orderedTests,
                          {
                            test_name: t.name,
                            test_type: 'Lab',
                            status: 'ordered',
                          },
                        ]);
                      }
                    }
                  )
                )}
            </div>
          </div>
        </div>
      )}

      {/* Visit History Floating Panel */}
      {historyDropdown === 'visit' && (
        <>
          <div
            className="history-panel-overlay"
            onClick={() => {
              setHistoryDropdown(null);
              setShowHistory(false);
            }}
          ></div>
          <div className="history-floating-panel history-visit-panel">
            <div className="history-panel-header">
              <h4>
                📅 Visit History —{' '}
                {historyData?.patient?.name || visit?.patient_name || 'Patient'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setHistoryDropdown(null);
                  setShowHistory(false);
                }}
                className="btn-close-panel"
              >
                ✕
              </button>
            </div>
            <div className="history-panel-body">
              {historyLoading && (
                <div className="history-loading-state">
                  Loading visit history...
                </div>
              )}
              {!historyLoading && historyData?.history?.length === 0 && (
                <div className="history-empty-state">
                  No past visits recorded.
                </div>
              )}
              {!historyLoading &&
                (historyData?.history || []).map((h, i) => (
                  <div key={i} className="visit-history-item">
                    <div className="visit-history-header">
                      <div className="visit-number-badge">
                        {h.visit?.visit_number || 'N/A'}
                      </div>
                      <div className="visit-date">
                        {h.visit?.created_at
                          ? new Date(h.visit.created_at).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )
                          : '—'}
                      </div>
                    </div>
                    {h.vitals && (
                      <div className="visit-vitals-grid">
                        {h.vitals.height_cm != null && (
                          <div className="visit-vital">
                            <span className="vital-label">HT:</span>{' '}
                            {h.vitals.height_cm}cm
                          </div>
                        )}
                        {h.vitals.weight != null && (
                          <div className="visit-vital">
                            <span className="vital-label">WT:</span>{' '}
                            {h.vitals.weight}kg
                          </div>
                        )}
                        {h.vitals.bp_systolic != null && (
                          <div className="visit-vital">
                            <span className="vital-label">BP:</span>{' '}
                            {h.vitals.bp_systolic}/{h.vitals.bp_diastolic}
                          </div>
                        )}
                        {h.vitals.temperature != null && (
                          <div className="visit-vital">
                            <span className="vital-label">TEMP:</span>{' '}
                            {h.vitals.temperature}°C
                          </div>
                        )}
                        {h.vitals.pr != null && (
                          <div className="visit-vital">
                            <span className="vital-label">PR:</span>{' '}
                            {h.vitals.pr}bpm
                          </div>
                        )}
                        {h.vitals.spo2 != null && (
                          <div className="visit-vital">
                            <span className="vital-label">SpO₂:</span>{' '}
                            {h.vitals.spo2}%
                          </div>
                        )}
                        {h.vitals.sugar != null && (
                          <div className="visit-vital">
                            <span className="vital-label">RBS:</span>{' '}
                            {h.vitals.sugar}mg/dL
                          </div>
                        )}
                      </div>
                    )}
                    {h.visit?.diagnosis && (
                      <div className="visit-diagnosis">
                        <strong>Diagnosis:</strong> {h.visit.diagnosis}
                      </div>
                    )}
                    {h.drugs?.length > 0 && (
                      <div className="visit-medications">
                        <strong>Medications ({h.drugs.length}):</strong>
                        <div className="visit-drugs-list">
                          {h.drugs.slice(0, 5).map((d, j) => (
                            <span key={j} className="visit-drug-chip">
                              {d.drug_name} {d.dosage} {d.frequency}
                            </span>
                          ))}
                          {h.drugs.length > 5 && (
                            <span className="visit-drug-chip">
                              +{h.drugs.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
