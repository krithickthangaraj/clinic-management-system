import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MedicineEntry from '../../components/MedicineEntry';
import { masterService } from '../../services/masterService';
import { templateService } from '../../services/templateService';
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

const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');

export default function TemplateEdit() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Consultation data
  const [templateComplaints, setTemplateComplaints] = useState([]);
  const [templateDiagnosis, setTemplateDiagnosis] = useState([]);
  const [templateAdvice, setTemplateAdvice] = useState([]);
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
  const [medicines, setMedicines] = useState([]);
  const [orderedTests, setOrderedTests] = useState([]);
  const [newTestName, setNewTestName] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [selectedFollowUpOption, setSelectedFollowUpOption] = useState(null);
  const [followUpTimeUnit, setFollowUpTimeUnit] = useState('day');

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadMasters = async () => {
    try {
      const [complaints, diagnosis, advice, tests] = await Promise.all([
        masterService.listComplaints().catch(() => []),
        masterService.listDiagnosis().catch(() => []),
        masterService.listAdvice().catch(() => []),
        masterService.listLabTests('', 'Lab').catch(() => []),
      ]);
      setComplaintsMaster(complaints);
      setDiagnosisMaster(diagnosis);
      setAdviceMaster(advice);
      setLabTestsMaster(tests);
    } catch (err) {
      console.error('Failed to load masters:', err);
    }
  };

  const loadData = async () => {
    try {
      if (templateId) {
        // Edit mode - load existing template
        const data = await templateService.getById(templateId);
        setTemplate(data);
        setTemplateName(data.name);

        // Parse complaints
        const complaints =
          typeof data.chief_complaints === 'string'
            ? JSON.parse(data.chief_complaints || '[]')
            : data.chief_complaints || [];
        setTemplateComplaints(complaints);

        // Parse diagnosis
        setTemplateDiagnosis(
          data.diagnosis
            ? typeof data.diagnosis === 'string'
              ? data.diagnosis.split(',').map((d) => d.trim())
              : [data.diagnosis]
            : []
        );

        // Parse advice
        if (data.advice) {
          const advices =
            typeof data.advice === 'string'
              ? data.advice.split(',').map((a) => a.trim())
              : [data.advice];
          setTemplateAdvice(advices);
        }

        // Parse medicines
        const drugs =
          typeof data.drugs === 'string'
            ? JSON.parse(data.drugs || '[]')
            : data.drugs || [];
        setMedicines(drugs);

        // Parse tests
        const tests =
          typeof data.tests === 'string'
            ? JSON.parse(data.tests || '[]')
            : data.tests || [];
        setOrderedTests(tests);

        // Parse follow-up
        if (data.follow_up_date) {
          setFollowUpDate(toDateInputValue(data.follow_up_date));
        }
        if (data.follow_up_notes) setFollowUpNotes(data.follow_up_notes);
      } else {
        // Create mode - initialize empty
        setTemplateName('');
        setTemplateComplaints([]);
        setTemplateDiagnosis([]);
        setTemplateAdvice([]);
        setMedicines([]);
        setOrderedTests([]);
      }

      await loadMasters();
    } catch (err) {
      console.error('Failed to load template:', err);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: templateName.trim(),
        chief_complaints: templateComplaints,
        diagnosis: templateDiagnosis.join(', '),
        advice: templateAdvice.join(', '),
        drugs: medicines,
        tests: orderedTests,
        follow_up_date: followUpDate || null,
        follow_up_notes: followUpNotes,
      };

      if (templateId) {
        await templateService.update(templateId, payload);
        alert('Template updated successfully!');
      } else {
        await templateService.create(payload);
        alert('Template created successfully!');
      }
      navigate('/doctor/queue');
    } catch (err) {
      console.error('Failed to save template:', err);
      alert(err.response?.data?.detail || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComplaint = async () => {
    const inputValue = complaintInput.trim();
    if (!inputValue) return;

    try {
      const created = await masterService.createComplaint(inputValue);
      setTemplateComplaints([...templateComplaints, created.name]);
      setComplaintInput('');
      await loadMasters();
    } catch (err) {
      console.error('Failed to add complaint:', err);
      alert('Failed to add complaint');
    }
  };

  const handleAddDiagnosis = async () => {
    const inputValue = diagnosisInput.trim();
    if (!inputValue) return;

    try {
      const created = await masterService.createDiagnosis(inputValue);
      setTemplateDiagnosis([...templateDiagnosis, created.name]);
      setDiagnosisInput('');
      await loadMasters();
    } catch (err) {
      console.error('Failed to add diagnosis:', err);
      alert('Failed to add diagnosis');
    }
  };

  const handleAddAdvice = async () => {
    const inputValue = adviceInput.trim();
    if (!inputValue) return;

    try {
      const created = await masterService.createAdvice(inputValue);
      setTemplateAdvice([...templateAdvice, created.name]);
      setAdviceInput('');
      await loadMasters();
    } catch (err) {
      console.error('Failed to add advice:', err);
      alert('Failed to add advice');
    }
  };

  const handleAddTest = async () => {
    const inputValue = newTestName.trim();
    if (!inputValue) return;

    try {
      if (
        orderedTests.find(
          (t) => t.test_name?.toLowerCase() === inputValue.toLowerCase()
        )
      ) {
        setNewTestName('');
        return;
      }

      const existing = labTestsMaster.find(
        (t) =>
          t.name.toLowerCase() === inputValue.toLowerCase() &&
          t.test_type === 'Lab'
      );
      if (!existing) {
        await masterService.createLabTest(inputValue, 'Lab');
        await loadMasters();
      }

      setOrderedTests([
        ...orderedTests,
        { test_name: inputValue, test_type: 'Lab', status: 'ordered' },
      ]);
      setNewTestName('');
    } catch (err) {
      console.error('Failed to add test:', err);
      alert('Failed to add test');
    }
  };

  const removeComplaint = (index) => {
    setTemplateComplaints(templateComplaints.filter((_, i) => i !== index));
  };

  const removeDiagnosis = (index) => {
    setTemplateDiagnosis(templateDiagnosis.filter((_, i) => i !== index));
  };

  const removeAdvice = (index) => {
    setTemplateAdvice(templateAdvice.filter((_, i) => i !== index));
  };

  const removeTest = (index) => {
    setOrderedTests(orderedTests.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="loading-container">Loading template...</div>;
  }

  return (
    <div className="consultation-layout">
      <div className="patient-sticky-header">
        <div className="header-top">
          <button
            onClick={() => navigate('/doctor/queue')}
            className="btn-icon-back"
          >
            ←
          </button>
          <div className="patient-main-info">
            <h2>{templateId ? 'Edit Template' : 'Create New Template'}</h2>
          </div>
        </div>
      </div>

      <div className="consultation-page-wrapper">
        <div className="consultation-content">
          {/* Template Name */}
          <section className="consult-card">
            <h3>Template Name</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Fever Follow-up, Diabetes Management"
              className="modern-input"
              autoFocus
            />
          </section>

          {/* Chief Complaints */}
          <section className="consult-card compact-card single-row-section">
            <div className="form-group">
              <label>Chief Complaints</label>
              <div className="chips-input-group">
                <div className="chips-list">
                  {templateComplaints.map((complaint, index) => (
                    <span key={index} className="chip">
                      {complaint}
                      <button
                        type="button"
                        onClick={() => removeComplaint(index)}
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="chips-input-row">
                  <input
                    type="text"
                    value={complaintInput}
                    onChange={(e) => setComplaintInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && handleAddComplaint()
                    }
                    placeholder="Type and press Enter"
                    className="modern-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddComplaint}
                    className="btn-secondary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Diagnosis */}
          <section className="consult-card compact-card single-row-section">
            <div className="form-group">
              <label>Diagnosis</label>
              <div className="chips-input-group">
                <div className="chips-list">
                  {templateDiagnosis.map((diagnosis, index) => (
                    <span key={index} className="chip">
                      {diagnosis}
                      <button
                        type="button"
                        onClick={() => removeDiagnosis(index)}
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="chips-input-row">
                  <input
                    type="text"
                    value={diagnosisInput}
                    onChange={(e) => setDiagnosisInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && handleAddDiagnosis()
                    }
                    placeholder="Type and press Enter"
                    className="modern-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddDiagnosis}
                    className="btn-secondary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Medications */}
          <section className="consult-card medications-section">
            <div className="form-group">
              <label>Medications</label>
              {medicines.length > 0 ? (
                <div className="medicines-list">
                  {medicines.map((med, index) => (
                    <div key={index} className="medicine-item">
                      <div className="medicine-info">
                        <strong>{med.drug_name}</strong>
                        <span className="medicine-dosage">{med.dosage}</span>
                        <span className="medicine-frequency">
                          {med.frequency}
                        </span>
                        <span className="medicine-days">
                          {med.number_of_days} days
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setMedicines(medicines.filter((_, i) => i !== index))
                        }
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No medications added yet</p>
              )}
              <MedicineEntry
                medicines={medicines}
                setMedicines={setMedicines}
                frequencyOptions={FREQUENCY_OPTIONS}
                dosageOptions={DOSAGE_OPTIONS}
              />
            </div>
          </section>

          {/* Advice */}
          <section className="consult-card compact-card single-row-section">
            <div className="form-group">
              <label>Doctor Advice</label>
              <div className="chips-input-group">
                <div className="chips-list">
                  {templateAdvice.map((advice, index) => (
                    <span key={index} className="chip">
                      {advice}
                      <button
                        type="button"
                        onClick={() => removeAdvice(index)}
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="chips-input-row">
                  <input
                    type="text"
                    value={adviceInput}
                    onChange={(e) => setAdviceInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAdvice()}
                    placeholder="Type and press Enter"
                    className="modern-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdvice}
                    className="btn-secondary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Investigation/Tests */}
          <section className="consult-card compact-card single-row-section">
            <div className="form-group">
              <label>Investigation / Tests</label>
              <div className="chips-input-group">
                <div className="chips-list">
                  {orderedTests.map((test, index) => (
                    <span key={index} className="chip">
                      {test.test_name}
                      <button
                        type="button"
                        onClick={() => removeTest(index)}
                        className="chip-remove"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="chips-input-row">
                  <input
                    type="text"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTest()}
                    placeholder="Type test name and press Enter"
                    className="modern-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddTest}
                    className="btn-secondary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Follow-up */}
          <section className="consult-card followup-card">
            <h3>Follow-up Settings</h3>
            <div className="form-group">
              <label>Follow-up Date</label>
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
          </section>

          {/* Save Actions */}
          <div className="consult-actions-bar">
            <button
              onClick={() => navigate('/doctor/queue')}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : templateId
                  ? 'Update Template'
                  : 'Create Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
