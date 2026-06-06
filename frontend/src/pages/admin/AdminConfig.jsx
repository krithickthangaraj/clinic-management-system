import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicConfig } from '../../config/clinicConfig';
import { useClinic } from '../../contexts/ClinicContext';
import { masterService } from '../../services/masterService';
import { templateService } from '../../services/templateService';
import './AdminConfig.css';

const toEditableClinicProfile = (clinic) => ({
  clinicName: clinic.clinicName || '',
  clinicAddress: clinic.clinicAddress || '',
  clinicLogoUrl: clinic.clinicLogoUrl || '',
  clinicPhone: clinic.clinicPhone || '',
  clinicEmail: clinic.clinicEmail || '',
  doctorName: clinic.doctorName || '',
  doctorQualifications: clinic.doctorQualifications || '',
  doctorLicenseNumber: clinic.doctorLicenseNumber || '',
  accentColor: clinic.accentColor || '#0f766e',
  secondaryColor: clinic.secondaryColor || '#2563eb',
  successColor: clinic.successColor || '#059669',
  dangerColor: clinic.dangerColor || '#dc2626',
  warningColor: clinic.warningColor || '#d97706',
  headerHeight: clinic.headerHeight || 70,
  compactMode: clinic.compactMode ?? true,
  spacingReductionPercent: clinic.spacingReductionPercent || 30,
  enablePatientHistory: clinic.enablePatientHistory ?? true,
  enablePrescriptionPrint: clinic.enablePrescriptionPrint ?? true,
  enableTestManagement: clinic.enableTestManagement ?? true,
  multiClinicSupport: clinic.multiClinicSupport ?? false,
});

export default function AdminConfig() {
  const clinic = useClinic();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => toEditableClinicProfile(clinic));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [complaints, setComplaints] = useState([]);
  const [diagnosis, setDiagnosis] = useState([]);
  const [advice, setAdvice] = useState([]);
  const [tests, setTests] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadLibraries();
  }, []);

  const loadLibraries = async () => {
    setLoading(true);
    try {
      const [complaintList, diagnosisList, adviceList, testList, templateList] =
        await Promise.all([
          masterService.listComplaints().catch(() => []),
          masterService.listDiagnosis().catch(() => []),
          masterService.listAdvice().catch(() => []),
          masterService.listLabTests('', 'Lab').catch(() => []),
          templateService.list().catch(() => []),
        ]);

      setComplaints(complaintList);
      setDiagnosis(diagnosisList);
      setAdvice(adviceList);
      setTests(testList);
      setTemplates(templateList);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    clinic.updateClinic(profile);
    setMessage('Clinic profile saved.');
    setTimeout(() => setMessage(''), 2200);
  };

  const librarySections = useMemo(
    () => [
      {
        title: 'Chief Complaints Library',
        items: complaints,
        setItems: setComplaints,
        create: masterService.createComplaint,
        update: masterService.updateComplaint,
        remove: masterService.deleteComplaint,
      },
      {
        title: 'Diagnosis Library',
        items: diagnosis,
        setItems: setDiagnosis,
        create: masterService.createDiagnosis,
        update: masterService.updateDiagnosis,
        remove: masterService.deleteDiagnosis,
      },
      {
        title: 'Doctor Advice Library',
        items: advice,
        setItems: setAdvice,
        create: masterService.createAdvice,
        update: masterService.updateAdvice,
        remove: masterService.deleteAdvice,
      },
      {
        title: 'Investigation / Tests Library',
        items: tests,
        setItems: setTests,
        create: (name) => masterService.createLabTest(name, 'Lab'),
        update: (id, name) => masterService.updateLabTest(id, name, 'Lab'),
        remove: masterService.deleteLabTest,
      },
    ],
    [complaints, diagnosis, advice, tests]
  );

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Admin Configuration</h1>
          <p>Clinic profile, branding, and shared clinical libraries.</p>
        </div>
        <button type="button" className="btn-back" onClick={() => navigate('/')}>
          Dashboard
        </button>
      </header>

      {message && <div className="admin-toast">{message}</div>}

      <section className="admin-panel">
        <div className="admin-section-title">
          <h2>Clinic Profile</h2>
          <span>Used by header and login page</span>
        </div>

        <form className="profile-grid" onSubmit={saveProfile}>
          <AdminField label="Logo / Image URL">
            <input
              value={profile.clinicLogoUrl || ''}
              onChange={(e) => setProfile({ ...profile, clinicLogoUrl: e.target.value })}
              placeholder="Emoji or image URL"
            />
          </AdminField>
          <AdminField label="Clinic Name">
            <input
              value={profile.clinicName || ''}
              onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Clinic Address">
            <input
              value={profile.clinicAddress || ''}
              onChange={(e) => setProfile({ ...profile, clinicAddress: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Phone">
            <input
              value={profile.clinicPhone || ''}
              onChange={(e) => setProfile({ ...profile, clinicPhone: e.target.value })}
            />
          </AdminField>
          <AdminField label="Email">
            <input
              value={profile.clinicEmail || ''}
              onChange={(e) => setProfile({ ...profile, clinicEmail: e.target.value })}
            />
          </AdminField>
          <AdminField label="Doctor Name">
            <input
              value={profile.doctorName || ''}
              onChange={(e) => setProfile({ ...profile, doctorName: e.target.value })}
              required
            />
          </AdminField>
          <AdminField label="Qualifications">
            <input
              value={profile.doctorQualifications || ''}
              onChange={(e) =>
                setProfile({ ...profile, doctorQualifications: e.target.value })
              }
            />
          </AdminField>
          <AdminField label="License Number">
            <input
              value={profile.doctorLicenseNumber || ''}
              onChange={(e) =>
                setProfile({ ...profile, doctorLicenseNumber: e.target.value })
              }
            />
          </AdminField>
          <AdminField label="Accent Color">
            <div className="color-input-row">
              <input
                type="color"
                value={profile.accentColor || '#0f766e'}
                onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
              />
              <input
                value={profile.accentColor || ''}
                onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
              />
            </div>
          </AdminField>

          <div className="profile-actions">
            <button type="button" className="btn-ghost" onClick={() => {
              clinic.resetClinic();
              setProfile(toEditableClinicProfile(clinicConfig));
            }}>
              Reset
            </button>
            <button type="submit" className="btn-primary">
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <div className="admin-libraries">
        {librarySections.map((section) => (
          <LibraryEditor key={section.title} {...section} />
        ))}

        <TemplateLibrary
          templates={templates}
          setTemplates={setTemplates}
          loading={loading}
        />
      </div>
    </div>
  );
}

function AdminField({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function LibraryEditor({ title, items, setItems, create, update, remove }) {
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const addItem = async (e) => {
    e.preventDefault();
    const value = newValue.trim();
    if (!value) return;
    const created = await create(value);
    setItems((current) =>
      current.find((item) => item.id === created.id) ? current : [...current, created]
    );
    setNewValue('');
  };

  const saveItem = async (item) => {
    const value = editingValue.trim();
    if (!value) return;
    const updated = await update(item.id, value);
    setItems((current) => current.map((it) => (it.id === item.id ? updated : it)));
    setEditingId(null);
    setEditingValue('');
  };

  const deleteItem = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await remove(item.id);
    setItems((current) => current.filter((it) => it.id !== item.id));
  };

  return (
    <section className="admin-panel library-panel">
      <div className="admin-section-title">
        <h2>{title}</h2>
        <span>{items.length} items</span>
      </div>

      <form className="library-add-row" onSubmit={addItem}>
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Add new item"
        />
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <div className="library-list">
        {items.map((item) => (
          <div key={item.id} className="library-item">
            {editingId === item.id ? (
              <input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveItem(item);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <span>{item.name}</span>
            )}
            <div className="library-actions">
              {editingId === item.id ? (
                <>
                  <button type="button" onClick={() => saveItem(item)}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => {
                    setEditingId(item.id);
                    setEditingValue(item.name);
                  }}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => deleteItem(item)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="library-empty">No items yet.</p>}
      </div>
    </section>
  );
}

function TemplateLibrary({ templates, setTemplates }) {
  const navigate = useNavigate();

  const deleteTemplate = async (template) => {
    if (!confirm(`Delete "${template.name}"?`)) return;
    await templateService.delete(template.id);
    setTemplates((current) => current.filter((item) => item.id !== template.id));
  };

  return (
    <section className="admin-panel library-panel medication-template-panel">
      <div className="admin-section-title">
        <h2>Medications Templates</h2>
        <span>{templates.length} templates</span>
      </div>

      <div className="template-actions-row">
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            navigate('/doctor/template/new', { state: { returnTo: '/admin/config' } })
          }
        >
          Create New Template
        </button>
      </div>

      <div className="library-list">
        {templates.map((template) => (
          <div key={template.id} className="library-item">
            <span>{template.name}</span>
            <div className="library-actions">
              <button
                type="button"
                onClick={() =>
                  navigate(`/doctor/template/${template.id}`, {
                    state: { returnTo: '/admin/config' },
                  })
                }
              >
                Edit Template
              </button>
              <button type="button" className="danger" onClick={() => deleteTemplate(template)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="library-empty">No templates yet.</p>}
      </div>
    </section>
  );
}
