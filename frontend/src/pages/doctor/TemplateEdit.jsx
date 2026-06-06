import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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

const FREQUENT_TESTS = ['CBC', 'RBS (Random Blood Sugar)', 'Lipid Profile', 'HbA1c'];

const EMPTY_VITALS = {
  height_cm: null,
  weight: null,
  sugar: null,
  bp_systolic: null,
  bp_diastolic: null,
  temperature: null,
  pr: null,
  spo2: null,
};

const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');

const parseJsonValue = (value, fallback) => {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const listFromText = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasName = (items, name) =>
  items.some((item) => item.toLowerCase() === name.toLowerCase());

const numberOrNull = (value) => {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function TemplateEdit() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/doctor/queue';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [editingVital, setEditingVital] = useState(null);
  const [vitalTemp, setVitalTemp] = useState({});

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
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await loadMasters();

      if (templateId) {
        const data = await templateService.getById(templateId);
        setTemplateName(data.name || '');
        setTemplateComplaints(parseJsonValue(data.chief_complaints, []));
        setTemplateDiagnosis(listFromText(data.diagnosis));
        setTemplateAdvice(listFromText(data.advice));
        setMedicines(parseJsonValue(data.drugs, []));
        setVitals({ ...EMPTY_VITALS, ...parseJsonValue(data.vitals, {}) });
        setOrderedTests(parseJsonValue(data.tests, []));
        setFollowUpDate(toDateInputValue(data.follow_up_date));
        setFollowUpNotes(data.follow_up_notes || '');
      } else {
        setTemplateName('');
        setTemplateComplaints([]);
        setTemplateDiagnosis([]);
        setTemplateAdvice([]);
        setMedicines([]);
        setVitals(EMPTY_VITALS);
        setOrderedTests([]);
        setFollowUpDate('');
        setFollowUpNotes('');
      }
    } catch (err) {
      console.error('Failed to load template:', err);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (!vitals?.weight || !vitals?.height_cm) return null;
    const bmi = Number(vitals.weight) / Math.pow(Number(vitals.height_cm) / 100, 2);
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
  };

  const beginVitalEdit = (field, values) => {
    setEditingVital(field);
    setVitalTemp(values);
  };

  const saveVital = (field) => {
    if (field === 'bp') {
      setVitals((current) => ({
        ...current,
        bp_systolic: numberOrNull(vitalTemp.bp_s),
        bp_diastolic: numberOrNull(vitalTemp.bp_d),
      }));
    } else {
      const fieldMap = {
        ht: 'height_cm',
        wt: 'weight',
        sugar: 'sugar',
        temp: 'temperature',
        pr: 'pr',
        spo2: 'spo2',
      };
      setVitals((current) => ({
        ...current,
        [fieldMap[field]]: numberOrNull(vitalTemp[field]),
      }));
    }
    setEditingVital(null);
  };

  const addSelected = (items, setItems, name) => {
    const nextName = name.trim();
    if (!nextName || hasName(items, nextName)) return;
    setItems([...items, nextName]);
  };

  const handleAddComplaint = async (e) => {
    e?.preventDefault();
    const inputValue = complaintInput.trim();
    if (!inputValue) return;

    try {
      const existing = complaintsMaster.find(
        (item) => item.name.toLowerCase() === inputValue.toLowerCase()
      );
      const name = existing ? existing.name : (await masterService.createComplaint(inputValue)).name;
      addSelected(templateComplaints, setTemplateComplaints, name);
      setComplaintInput('');
      if (!existing) await loadMasters();
    } catch (err) {
      console.error('Failed to add complaint:', err);
      alert('Failed to add complaint');
    }
  };

  const handleAddDiagnosis = async (e) => {
    e?.preventDefault();
    const inputValue = diagnosisInput.trim();
    if (!inputValue) return;

    try {
      const existing = diagnosisMaster.find(
        (item) => item.name.toLowerCase() === inputValue.toLowerCase()
      );
      const name = existing ? existing.name : (await masterService.createDiagnosis(inputValue)).name;
      addSelected(templateDiagnosis, setTemplateDiagnosis, name);
      setDiagnosisInput('');
      if (!existing) await loadMasters();
    } catch (err) {
      console.error('Failed to add diagnosis:', err);
      alert('Failed to add diagnosis');
    }
  };

  const handleAddAdvice = async (e) => {
    e?.preventDefault();
    const inputValue = adviceInput.trim();
    if (!inputValue) return;

    try {
      const existing = adviceMaster.find(
        (item) => item.name.toLowerCase() === inputValue.toLowerCase()
      );
      const name = existing ? existing.name : (await masterService.createAdvice(inputValue)).name;
      addSelected(templateAdvice, setTemplateAdvice, name);
      setAdviceInput('');
      if (!existing) await loadMasters();
    } catch (err) {
      console.error('Failed to add advice:', err);
      alert('Failed to add advice');
    }
  };

  const handleAddTest = async (name = newTestName) => {
    const inputValue = name.trim();
    if (!inputValue) return;
    if (orderedTests.some((test) => test.test_name?.toLowerCase() === inputValue.toLowerCase())) {
      setNewTestName('');
      return;
    }

    try {
      const existing = labTestsMaster.find(
        (test) =>
          test.name.toLowerCase() === inputValue.toLowerCase() &&
          test.test_type === 'Lab'
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

  const setQuickFollowUp = (option, amount, unit) => {
    const date = new Date();
    if (unit === 'day') date.setDate(date.getDate() + amount);
    if (unit === 'month') date.setMonth(date.getMonth() + amount);
    setFollowUpDate(date.toISOString().split('T')[0]);
    setSelectedFollowUpOption(option);
  };

  const adjustFollowUpDate = (direction) => {
    const baseDate = followUpDate ? new Date(followUpDate) : new Date();
    const date = new Date(baseDate);
    if (followUpTimeUnit === 'day') date.setDate(date.getDate() + direction);
    if (followUpTimeUnit === 'week') date.setDate(date.getDate() + direction * 7);
    if (followUpTimeUnit === 'month') date.setMonth(date.getMonth() + direction);
    setFollowUpDate(date.toISOString().split('T')[0]);
    setSelectedFollowUpOption('custom');
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
        vitals,
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
      navigate(returnTo);
    } catch (err) {
      console.error('Failed to save template:', err);
      alert(err.response?.data?.detail || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const renderMasterModal = (show, setShow, title, items, selected, onSelect) => {
    if (!show) return null;

    return (
      <div className="modal-overlay" onClick={() => setShow(false)}>
        <div className="master-modal" onClick={(e) => e.stopPropagation()}>
          <div className="master-modal-header">
            <h3>{title}</h3>
            <button type="button" onClick={() => setShow(false)} className="btn-close">
              x
            </button>
          </div>
          <div className="modal-chips-grid">
            {items.map((item) => {
              const name = item.name || item.test_name;
              const isSelected = selected.some(
                (selectedItem) =>
                  String(selectedItem).toLowerCase() === String(name).toLowerCase()
              );
              return (
                <button
                  key={item.id || name}
                  type="button"
                  className={`complaint-chip clickable ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelect(name)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-container">Loading template...</div>;
  }

  return (
    <div className="consultation-layout template-attending-layout">
      <div className="patient-sticky-header">
        <div className="header-top">
          <button
            onClick={() => navigate(returnTo)}
            className="btn-icon-back"
            type="button"
          >
            &larr;
          </button>
          <div className="patient-main-info template-title-block">
            <h2>{templateId ? 'Edit Template' : 'Create New Template'}</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="modern-input template-name-inline"
              autoFocus
            />
          </div>
        </div>

        <div className="vitals-strip-single">
          <div
            className="vital-pill-compact"
            onClick={() => beginVitalEdit('ht', { ht: String(vitals.height_cm ?? '') })}
          >
            <span className="vital-icon">HT</span>
            <span className="label-compact">HT</span>
            {editingVital === 'ht' ? (
              <input
                className="value-inline-compact"
                type="number"
                step="0.1"
                value={vitalTemp.ht}
                onChange={(e) => setVitalTemp((current) => ({ ...current, ht: e.target.value }))}
                onBlur={() => saveVital('ht')}
                onKeyDown={(e) => e.key === 'Enter' && saveVital('ht')}
                onClick={(e) => e.stopPropagation()}
                placeholder="cm"
              />
            ) : (
              <span className="value-compact">
                {vitals.height_cm != null ? `${vitals.height_cm}cm` : '-'}
              </span>
            )}
          </div>
          <div
            className="vital-pill-compact"
            onClick={() => beginVitalEdit('wt', { wt: String(vitals.weight ?? '') })}
          >
            <span className="vital-icon">WT</span>
            <span className="label-compact">WT</span>
            {editingVital === 'wt' ? (
              <input
                className="value-inline-compact"
                type="number"
                step="0.1"
                value={vitalTemp.wt}
                onChange={(e) => setVitalTemp((current) => ({ ...current, wt: e.target.value }))}
                onBlur={() => saveVital('wt')}
                onKeyDown={(e) => e.key === 'Enter' && saveVital('wt')}
                onClick={(e) => e.stopPropagation()}
                placeholder="kg"
              />
            ) : (
              <span className="value-compact">
                {vitals.weight != null ? `${vitals.weight}kg` : '-'}
              </span>
            )}
          </div>
          <div className="vital-pill-compact vital-pill-bmi-compact">
            <span className="vital-icon">BMI</span>
            <span className="label-compact">BMI</span>
            <span className="value-compact">{calculateBMI() ?? '-'}</span>
          </div>
          <div
            className="vital-pill-compact"
            onClick={() => beginVitalEdit('sugar', { sugar: String(vitals.sugar ?? '') })}
          >
            <span className="vital-icon">RBS</span>
            <span className="label-compact">RBS</span>
            {editingVital === 'sugar' ? (
              <input
                className="value-inline-compact"
                type="number"
                step="0.1"
                value={vitalTemp.sugar}
                onChange={(e) => setVitalTemp((current) => ({ ...current, sugar: e.target.value }))}
                onBlur={() => saveVital('sugar')}
                onKeyDown={(e) => e.key === 'Enter' && saveVital('sugar')}
                onClick={(e) => e.stopPropagation()}
                placeholder="mg/dL"
              />
            ) : (
              <span className="value-compact">{vitals.sugar != null ? vitals.sugar : '-'}</span>
            )}
          </div>
          <div
            className="vital-pill-compact"
            onClick={() =>
              beginVitalEdit('bp', {
                bp_s: String(vitals.bp_systolic ?? ''),
                bp_d: String(vitals.bp_diastolic ?? ''),
              })
            }
          >
            <span className="vital-icon">BP</span>
            <span className="label-compact">BP</span>
            {editingVital === 'bp' ? (
              <span className="value-edit-compact" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  value={vitalTemp.bp_s}
                  onChange={(e) => setVitalTemp((current) => ({ ...current, bp_s: e.target.value }))}
                  onBlur={() => saveVital('bp')}
                  onKeyDown={(e) => e.key === 'Enter' && saveVital('bp')}
                  placeholder="S"
                />
                <span>/</span>
                <input
                  type="number"
                  value={vitalTemp.bp_d}
                  onChange={(e) => setVitalTemp((current) => ({ ...current, bp_d: e.target.value }))}
                  onBlur={() => saveVital('bp')}
                  onKeyDown={(e) => e.key === 'Enter' && saveVital('bp')}
                  placeholder="D"
                />
              </span>
            ) : (
              <span className="value-compact">
                {vitals.bp_systolic ?? '-'}/{vitals.bp_diastolic ?? '-'}
              </span>
            )}
          </div>
          <div
            className="vital-pill-compact"
            onClick={() => beginVitalEdit('temp', { temp: String(vitals.temperature ?? '') })}
          >
            <span className="vital-icon">TEMP</span>
            <span className="label-compact">TEMP</span>
            {editingVital === 'temp' ? (
              <input
                className="value-inline-compact"
                type="number"
                step="0.1"
                value={vitalTemp.temp}
                onChange={(e) => setVitalTemp((current) => ({ ...current, temp: e.target.value }))}
                onBlur={() => saveVital('temp')}
                onKeyDown={(e) => e.key === 'Enter' && saveVital('temp')}
                onClick={(e) => e.stopPropagation()}
                placeholder="C"
              />
            ) : (
              <span className="value-compact">
                {vitals.temperature != null ? `${vitals.temperature}C` : '-'}
              </span>
            )}
          </div>
          <div
            className="vital-pill-compact"
            onClick={() => beginVitalEdit('pr', { pr: String(vitals.pr ?? '') })}
          >
            <span className="vital-icon">PR</span>
            <span className="label-compact">PR</span>
            {editingVital === 'pr' ? (
              <input
                className="value-inline-compact"
                type="number"
                value={vitalTemp.pr}
                onChange={(e) => setVitalTemp((current) => ({ ...current, pr: e.target.value }))}
                onBlur={() => saveVital('pr')}
                onKeyDown={(e) => e.key === 'Enter' && saveVital('pr')}
                onClick={(e) => e.stopPropagation()}
                placeholder="bpm"
              />
            ) : (
              <span className="value-compact">{vitals.pr != null ? vitals.pr : '-'}</span>
            )}
          </div>
          <div
            className="vital-pill-compact"
            onClick={() => beginVitalEdit('spo2', { spo2: String(vitals.spo2 ?? '') })}
          >
            <span className="vital-icon">SpO2</span>
            <span className="label-compact">SpO2</span>
            {editingVital === 'spo2' ? (
              <input
                className="value-inline-compact"
                type="number"
                value={vitalTemp.spo2}
                onChange={(e) => setVitalTemp((current) => ({ ...current, spo2: e.target.value }))}
                onBlur={() => saveVital('spo2')}
                onKeyDown={(e) => e.key === 'Enter' && saveVital('spo2')}
                onClick={(e) => e.stopPropagation()}
                placeholder="%"
              />
            ) : (
              <span className="value-compact">{vitals.spo2 != null ? `${vitals.spo2}%` : '-'}</span>
            )}
          </div>
        </div>
      </div>

      <div className="consultation-content">
        <div className="consultation-sections">
          <div className="consultation-row clinical-row-primary">
            <section className="consult-card compact-card single-row-section">
              <h3>Chief Complaints</h3>
              {templateComplaints.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {templateComplaints.map((complaint) => (
                    <span key={complaint} className="complaint-chip active">
                      {complaint}
                      <button
                        type="button"
                        onClick={() =>
                          setTemplateComplaints(
                            templateComplaints.filter((item) => item !== complaint)
                          )
                        }
                        className="chip-remove"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {complaintsMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">Available Complaints (Click to add):</div>
                  <div className="chips-grid master-chips-grid">
                    {complaintsMaster
                      .filter((item) => !hasName(templateComplaints, item.name))
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={() =>
                            addSelected(templateComplaints, setTemplateComplaints, item.name)
                          }
                        >
                          {item.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <div className="complaint-input-group">
                <input
                  type="text"
                  placeholder="Type new complaint..."
                  value={complaintInput}
                  onChange={(e) => setComplaintInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComplaint(e)}
                  list="template-complaint-suggestions"
                  className="modern-input"
                />
                <datalist id="template-complaint-suggestions">
                  {complaintsMaster.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
                {complaintInput.trim() && (
                  <button type="button" onClick={handleAddComplaint} className="btn-add-complaint">
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(true)}
                  className="btn-show-all"
                  title="Show all complaints"
                >
                  List
                </button>
              </div>
            </section>

            <section className="consult-card compact-card single-row-section">
              <h3>Diagnosis</h3>
              {templateDiagnosis.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {templateDiagnosis.map((diagnosis) => (
                    <span key={diagnosis} className="complaint-chip active">
                      {diagnosis}
                      <button
                        type="button"
                        onClick={() =>
                          setTemplateDiagnosis(
                            templateDiagnosis.filter((item) => item !== diagnosis)
                          )
                        }
                        className="chip-remove"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {diagnosisMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">Available Diagnosis (Click to add):</div>
                  <div className="chips-grid master-chips-grid">
                    {diagnosisMaster
                      .filter((item) => !hasName(templateDiagnosis, item.name))
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={() =>
                            addSelected(templateDiagnosis, setTemplateDiagnosis, item.name)
                          }
                        >
                          {item.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <div className="complaint-input-group">
                <input
                  type="text"
                  placeholder="Type new diagnosis..."
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDiagnosis(e)}
                  list="template-diagnosis-suggestions"
                  className="modern-input"
                />
                <datalist id="template-diagnosis-suggestions">
                  {diagnosisMaster.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
                {diagnosisInput.trim() && (
                  <button type="button" onClick={handleAddDiagnosis} className="btn-add-complaint">
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDiagnosisModal(true)}
                  className="btn-show-all"
                  title="Show all diagnosis"
                >
                  List
                </button>
              </div>
            </section>
          </div>

          <div className="consultation-row clinical-row-secondary">
            <section className="consult-card compact-card single-row-section">
              <h3>Doctor's Advice</h3>
              {templateAdvice.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {templateAdvice.map((advice) => (
                    <span key={advice} className="complaint-chip active">
                      {advice}
                      <button
                        type="button"
                        onClick={() =>
                          setTemplateAdvice(templateAdvice.filter((item) => item !== advice))
                        }
                        className="chip-remove"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {adviceMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">Available Advice (Click to add):</div>
                  <div className="chips-grid master-chips-grid">
                    {adviceMaster
                      .filter((item) => !hasName(templateAdvice, item.name))
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={() => addSelected(templateAdvice, setTemplateAdvice, item.name)}
                        >
                          {item.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <div className="complaint-input-group">
                <input
                  type="text"
                  placeholder="Type new advice..."
                  value={adviceInput}
                  onChange={(e) => setAdviceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAdvice(e)}
                  list="template-advice-suggestions"
                  className="modern-input"
                />
                <datalist id="template-advice-suggestions">
                  {adviceMaster.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
                {adviceInput.trim() && (
                  <button type="button" onClick={handleAddAdvice} className="btn-add-complaint">
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdviceModal(true)}
                  className="btn-show-all"
                  title="Show all advice"
                >
                  List
                </button>
              </div>
            </section>

            <section className="consult-card compact-card single-row-section">
              <h3>Investigations / Tests</h3>
              {orderedTests.length > 0 && (
                <div className="chips-grid chips-above-input">
                  {orderedTests.map((test) => (
                    <span key={test.test_name} className="complaint-chip active">
                      {test.test_name}
                      <button
                        type="button"
                        onClick={() =>
                          setOrderedTests(
                            orderedTests.filter((item) => item.test_name !== test.test_name)
                          )
                        }
                        className="chip-remove"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {labTestsMaster.length > 0 && (
                <div className="master-chips-section">
                  <div className="master-chips-label">Available Tests (Click to add):</div>
                  <div className="chips-grid master-chips-grid">
                    {labTestsMaster
                      .filter((item) => item.test_type === 'Lab')
                      .filter(
                        (item) =>
                          !orderedTests.some(
                            (test) => test.test_name?.toLowerCase() === item.name.toLowerCase()
                          )
                      )
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="complaint-chip clickable"
                          onClick={() => handleAddTest(item.name)}
                        >
                          {item.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {FREQUENT_TESTS.filter(
                (test) =>
                  !orderedTests.some((item) => item.test_name === test) &&
                  !labTestsMaster.some((item) => item.name === test)
              ).length > 0 && (
                <div className="frequent-tests-chips">
                  <span className="frequent-tests-label">Quick Add Common Tests:</span>
                  {FREQUENT_TESTS.filter(
                    (test) =>
                      !orderedTests.some((item) => item.test_name === test) &&
                      !labTestsMaster.some((item) => item.name === test)
                  ).map((test) => (
                    <button
                      key={test}
                      type="button"
                      className="frequent-test-chip"
                      onClick={() => handleAddTest(test)}
                    >
                      {test}
                    </button>
                  ))}
                </div>
              )}
              <div className="test-entry-group">
                <input
                  type="text"
                  placeholder="Type new test..."
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  list="template-test-suggestions"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTestName.trim()) {
                      e.preventDefault();
                      handleAddTest();
                    }
                  }}
                />
                <datalist id="template-test-suggestions">
                  {labTestsMaster
                    .filter((item) => item.test_type === 'Lab')
                    .map((item) => (
                      <option key={item.id} value={item.name} />
                    ))}
                </datalist>
                {newTestName.trim() && (
                  <button type="button" className="btn-add-circle" onClick={() => handleAddTest()}>
                    +
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  className="btn-show-all"
                  title="Show all tests"
                >
                  List
                </button>
              </div>
            </section>
          </div>

          <section className="consult-card medications-section">
            <h3>Medications</h3>
            <MedicineEntry
              onAdd={(medicine) => setMedicines([...medicines, medicine])}
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
                    {medicines.map((medicine, index) => (
                      <tr key={`${medicine.drug_name}-${index}`}>
                        <td>{index + 1}</td>
                        <td className="font-bold">{medicine.drug_name}</td>
                        <td>{medicine.dosage}</td>
                        <td>{medicine.frequency}</td>
                        <td>{medicine.number_of_days}</td>
                        <td>
                          <span className="qty-pill">{medicine.quantity}</span>
                        </td>
                        <td>{medicine.instructions || '-'}</td>
                        <td className="text-right med-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setMedicines(medicines.filter((_, itemIndex) => itemIndex !== index))
                            }
                            className="btn-table-delete"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="followup-fees-grid template-followup-grid">
            <section className="consult-card followup-card">
              <h3>Follow-up</h3>
              <div className="followup-content">
                <div className="followup-quick-options">
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === 'tomorrow' ? 'active' : ''}`}
                    onClick={() => setQuickFollowUp('tomorrow', 1, 'day')}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '2days' ? 'active' : ''}`}
                    onClick={() => setQuickFollowUp('2days', 2, 'day')}
                  >
                    2 Days
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '3days' ? 'active' : ''}`}
                    onClick={() => setQuickFollowUp('3days', 3, 'day')}
                  >
                    3 Days
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '1week' ? 'active' : ''}`}
                    onClick={() => setQuickFollowUp('1week', 7, 'day')}
                  >
                    1 Week
                  </button>
                  <button
                    type="button"
                    className={`followup-pill ${selectedFollowUpOption === '1month' ? 'active' : ''}`}
                    onClick={() => setQuickFollowUp('1month', 1, 'month')}
                  >
                    1 Month
                  </button>
                </div>

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
                        onClick={() => adjustFollowUpDate(-1)}
                        title={`Subtract 1 ${followUpTimeUnit}`}
                      >
                        -
                      </button>
                      <div className="followup-date-display-inline">
                        {followUpDate ? (
                          <span className="followup-date-value">
                            {new Date(followUpDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="followup-date-placeholder">Select date</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="followup-adjust-btn followup-plus-btn"
                        onClick={() => adjustFollowUpDate(1)}
                        title={`Add 1 ${followUpTimeUnit}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
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
          </div>

          <div className="consult-actions-bar">
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : templateId ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>
      </div>

      {renderMasterModal(
        showComplaintModal,
        setShowComplaintModal,
        'All Complaints',
        complaintsMaster,
        templateComplaints,
        (name) => addSelected(templateComplaints, setTemplateComplaints, name)
      )}
      {renderMasterModal(
        showDiagnosisModal,
        setShowDiagnosisModal,
        'All Diagnosis',
        diagnosisMaster,
        templateDiagnosis,
        (name) => addSelected(templateDiagnosis, setTemplateDiagnosis, name)
      )}
      {renderMasterModal(
        showAdviceModal,
        setShowAdviceModal,
        'All Advice',
        adviceMaster,
        templateAdvice,
        (name) => addSelected(templateAdvice, setTemplateAdvice, name)
      )}
      {renderMasterModal(
        showTestModal,
        setShowTestModal,
        'All Investigation / Tests',
        labTestsMaster.filter((item) => item.test_type === 'Lab'),
        orderedTests.map((test) => test.test_name),
        (name) => handleAddTest(name)
      )}
    </div>
  );
}
