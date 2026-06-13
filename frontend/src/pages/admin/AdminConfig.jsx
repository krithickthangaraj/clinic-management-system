import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicConfig } from '../../config/clinicConfig';
import { useClinic } from '../../contexts/ClinicContext';
import { masterService } from '../../services/masterService';
import { medicineService } from '../../services/medicineService';
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
  const [drugs, setDrugs] = useState([]);
  const [types, setTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [dosages, setDosages] = useState([]);

  useEffect(() => {
    loadLibraries();
  }, []);

  const loadLibraries = async () => {
    setLoading(true);
    try {
      const [
        complaintList,
        diagnosisList,
        adviceList,
        testList,
        templateList,
        drugsList,
        typesList,
        brandsList,
        dosagesList,
      ] = await Promise.all([
        masterService.listComplaints().catch(() => []),
        masterService.listDiagnosis().catch(() => []),
        masterService.listAdvice().catch(() => []),
        masterService.listLabTests('', 'Lab').catch(() => []),
        templateService.list().catch(() => []),
        medicineService.searchDrugs('').catch(() => []),
        medicineService.listTypes().catch(() => []),
        medicineService.listBrands({}).catch(() => []),
        medicineService.listDosages({}).catch(() => []),
      ]);

      setComplaints(complaintList);
      setDiagnosis(diagnosisList);
      setAdvice(adviceList);
      setTests(testList);
      setTemplates(templateList);
      setDrugs(drugsList || []);
      setTypes(typesList || []);
      setBrands(brandsList || []);
      setDosages(dosagesList || []);
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
      {
        title: 'Medicine Drugs',
        items: drugs,
        setItems: setDrugs,
        create: medicineService.createDrug,
        update: medicineService.updateDrug,
        remove: medicineService.deleteDrug,
      },
      {
        title: 'Medicine Types',
        items: types,
        setItems: setTypes,
        create: medicineService.createType,
        update: medicineService.updateType,
        remove: medicineService.deleteType,
      },
    ],
    [complaints, diagnosis, advice, tests, drugs, types]
  );

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Admin Configuration</h1>
          <p>Clinic profile, branding, and shared clinical libraries.</p>
        </div>
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/')}
        >
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
              onChange={(e) =>
                setProfile({ ...profile, clinicLogoUrl: e.target.value })
              }
              placeholder="Emoji or image URL"
            />
          </AdminField>
          <AdminField label="Clinic Name">
            <input
              value={profile.clinicName || ''}
              onChange={(e) =>
                setProfile({ ...profile, clinicName: e.target.value })
              }
              required
            />
          </AdminField>
          <AdminField label="Clinic Address">
            <input
              value={profile.clinicAddress || ''}
              onChange={(e) =>
                setProfile({ ...profile, clinicAddress: e.target.value })
              }
              required
            />
          </AdminField>
          <AdminField label="Phone">
            <input
              value={profile.clinicPhone || ''}
              onChange={(e) =>
                setProfile({ ...profile, clinicPhone: e.target.value })
              }
            />
          </AdminField>
          <AdminField label="Email">
            <input
              value={profile.clinicEmail || ''}
              onChange={(e) =>
                setProfile({ ...profile, clinicEmail: e.target.value })
              }
            />
          </AdminField>
          <AdminField label="Doctor Name">
            <input
              value={profile.doctorName || ''}
              onChange={(e) =>
                setProfile({ ...profile, doctorName: e.target.value })
              }
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
                onChange={(e) =>
                  setProfile({ ...profile, accentColor: e.target.value })
                }
              />
              <input
                value={profile.accentColor || ''}
                onChange={(e) =>
                  setProfile({ ...profile, accentColor: e.target.value })
                }
              />
            </div>
          </AdminField>

          <div className="profile-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                clinic.resetClinic();
                setProfile(toEditableClinicProfile(clinicConfig));
              }}
            >
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

        <BrandEditor
          brands={brands}
          setBrands={setBrands}
          drugs={drugs}
          types={types}
        />

        <DosageEditor
          dosages={dosages}
          setDosages={setDosages}
          brands={brands}
        />

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
      current.find((item) => item.id === created.id)
        ? current
        : [...current, created]
    );
    setNewValue('');
  };

  const saveItem = async (item) => {
    const value = editingValue.trim();
    if (!value) return;
    const updated = await update(item.id, value);
    setItems((current) =>
      current.map((it) => (it.id === item.id ? updated : it))
    );
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
        <button type="submit" className="btn-primary">
          Add
        </button>
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
                  <button type="button" onClick={() => saveItem(item)}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingValue(item.name);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteItem(item)}
                  >
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
    setTemplates((current) =>
      current.filter((item) => item.id !== template.id)
    );
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
            navigate('/doctor/template/new', {
              state: { returnTo: '/admin/config' },
            })
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
              <button
                type="button"
                className="danger"
                onClick={() => deleteTemplate(template)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="library-empty">No templates yet.</p>
        )}
      </div>
    </section>
  );
}

// --- Medicine master editors: Brands and Dosages
function BrandEditor({ brands, setBrands, drugs, types }) {
  const [name, setName] = useState('');
  const [drugId, setDrugId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValues, setEditingValues] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const list = await medicineService.listBrands({});
        setBrands(list || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim() || !drugId) return;
    const created = await medicineService.createBrand({
      drug_id: parseInt(drugId),
      type_id: typeId ? parseInt(typeId) : null,
      name: name.trim(),
    });
    setBrands((cur) => [...cur, created]);
    setName('');
    setTypeId('');
    setDrugId('');
  };

  const save = async (id) => {
    const data = editingValues[id];
    if (!data?.name || !data?.drug_id) return;
    const updated = await medicineService.updateBrand(id, {
      drug_id: parseInt(data.drug_id),
      type_id: data.type_id ? parseInt(data.type_id) : null,
      name: data.name,
    });
    setBrands((cur) => cur.map((b) => (b.id === id ? updated : b)));
    setEditingId(null);
  };

  const remove = async (b) => {
    if (!confirm(`Disable brand "${b.name}"?`)) return;
    await medicineService.deleteBrand(b.id);
    setBrands((cur) => cur.filter((x) => x.id !== b.id));
  };

  return (
    <section className="admin-panel library-panel">
      <div className="admin-section-title">
        <h2>Medicine Brands</h2>
        <span>{brands.length} brands</span>
      </div>

      <form className="library-add-row" onSubmit={add}>
        <select value={drugId} onChange={(e) => setDrugId(e.target.value)}>
          <option value="">Select Drug</option>
          {drugs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">Type (optional)</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Brand name"
        />
        <button type="submit" className="btn-primary">
          Add Brand
        </button>
      </form>

      <div className="library-list">
        {brands.map((b) => (
          <div key={b.id} className="library-item">
            {editingId === b.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={editingValues[b.id]?.drug_id || ''}
                  onChange={(e) =>
                    setEditingValues({
                      ...editingValues,
                      [b.id]: {
                        ...editingValues[b.id],
                        drug_id: e.target.value,
                      },
                    })
                  }
                >
                  <option value="">Select Drug</option>
                  {drugs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <input
                  value={editingValues[b.id]?.name || ''}
                  onChange={(e) =>
                    setEditingValues({
                      ...editingValues,
                      [b.id]: { ...editingValues[b.id], name: e.target.value },
                    })
                  }
                />
              </div>
            ) : (
              <span>
                {b.name}{' '}
                <small style={{ color: '#6b7280' }}>
                  {drugs.find((d) => d.id === b.drug_id)?.name || ''}
                  {b.type_id
                    ? ` • ${types.find((t) => t.id === b.type_id)?.name || ''}`
                    : ''}
                </small>
              </span>
            )}
            <div className="library-actions">
              {editingId === b.id ? (
                <>
                  <button onClick={() => save(b.id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingId(b.id);
                      setEditingValues({
                        ...editingValues,
                        [b.id]: {
                          name: b.name,
                          drug_id: b.drug_id,
                          type_id: b.type_id,
                        },
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button className="danger" onClick={() => remove(b)}>
                    Disable
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {brands.length === 0 && <p className="library-empty">No brands yet.</p>}
      </div>
    </section>
  );
}

function DosageEditor({ dosages, setDosages, brands }) {
  const [label, setLabel] = useState('');
  const [brandId, setBrandId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValues, setEditingValues] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const list = await medicineService.listDosages({});
        setDosages(list || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!label.trim() || !brandId) return;
    const created = await medicineService.createDosage({
      brand_id: parseInt(brandId),
      label: label.trim(),
      default_instruction: instruction || null,
    });
    setDosages((cur) => [...cur, created]);
    setLabel('');
    setInstruction('');
    setBrandId('');
  };

  const save = async (id) => {
    const data = editingValues[id];
    if (!data?.label || !data?.brand_id) return;
    const updated = await medicineService.updateDosage(id, {
      brand_id: parseInt(data.brand_id),
      label: data.label,
      default_instruction: data.default_instruction,
    });
    setDosages((cur) => cur.map((d) => (d.id === id ? updated : d)));
    setEditingId(null);
  };

  const remove = async (d) => {
    if (!confirm(`Disable dosage "${d.label}"?`)) return;
    await medicineService.deleteDosage(d.id);
    setDosages((cur) => cur.filter((x) => x.id !== d.id));
  };

  return (
    <section className="admin-panel library-panel">
      <div className="admin-section-title">
        <h2>Dosages</h2>
        <span>{dosages.length} items</span>
      </div>

      <form className="library-add-row" onSubmit={add}>
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">Select Brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label e.g. 500 mg"
        />
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Default instruction"
        />
        <button type="submit" className="btn-primary">
          Add Dosage
        </button>
      </form>

      <div className="library-list">
        {dosages.map((d) => (
          <div key={d.id} className="library-item">
            {editingId === d.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={editingValues[d.id]?.brand_id || ''}
                  onChange={(e) =>
                    setEditingValues({
                      ...editingValues,
                      [d.id]: {
                        ...editingValues[d.id],
                        brand_id: e.target.value,
                      },
                    })
                  }
                >
                  <option value="">Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <input
                  value={editingValues[d.id]?.label || ''}
                  onChange={(e) =>
                    setEditingValues({
                      ...editingValues,
                      [d.id]: { ...editingValues[d.id], label: e.target.value },
                    })
                  }
                />
                <input
                  value={editingValues[d.id]?.default_instruction || ''}
                  onChange={(e) =>
                    setEditingValues({
                      ...editingValues,
                      [d.id]: {
                        ...editingValues[d.id],
                        default_instruction: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ) : (
              <span>
                {d.label}{' '}
                <small style={{ color: '#6b7280' }}>
                  {brands.find((b) => b.id === d.brand_id)?.name || ''}
                </small>
              </span>
            )}
            <div className="library-actions">
              {editingId === d.id ? (
                <>
                  <button onClick={() => save(d.id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingId(d.id);
                      setEditingValues({
                        ...editingValues,
                        [d.id]: {
                          label: d.label,
                          brand_id: d.brand_id,
                          default_instruction: d.default_instruction,
                        },
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button className="danger" onClick={() => remove(d)}>
                    Disable
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {dosages.length === 0 && (
          <p className="library-empty">No dosages yet.</p>
        )}
      </div>
    </section>
  );
}
