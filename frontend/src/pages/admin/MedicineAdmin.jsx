import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicineService } from '../../services/medicineService';
import './AdminConfig.css';

export default function MedicineAdmin() {
  const navigate = useNavigate();
  const [drugs, setDrugs] = useState([]);
  const [types, setTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [dosages, setDosages] = useState([]);

  const drugRef = useRef();
  const typeRef = useRef();
  const brandRef = useRef();
  const dosageRef = useRef();
  const instructionRef = useRef();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [d1, t1, b1, ds1] = await Promise.all([
      medicineService.searchDrugs(''),
      medicineService.listTypes(''),
      medicineService.listBrands({}),
      medicineService.listDosages({}),
    ]);
    setDrugs(d1 || []);
    setTypes(t1 || []);
    setBrands(b1 || []);
    setDosages(ds1 || []);
  };

  const createDrug = async (e) => {
    e.preventDefault();
    const name = drugRef.current.value.trim();
    if (!name) return;
    const created = await medicineService.createDrug(name);
    setDrugs((c) => [...c, created]);
    drugRef.current.value = '';
  };

  const createType = async (e) => {
    e.preventDefault();
    const name = typeRef.current.value.trim();
    if (!name) return;
    const created = await medicineService.createType(name);
    setTypes((c) => [...c, created]);
    typeRef.current.value = '';
  };

  const createBrand = async (e) => {
    e.preventDefault();
    const drug_id = parseInt(brandRef.current.dataset.drug || 0) || null;
    const name = brandRef.current.value.trim();
    if (!name || !drug_id) return alert('Select drug and brand name');
    try {
      const created = await medicineService.createBrand({
        drug_id,
        type_id: null,
        name,
      });
      setBrands((c) => [...c, created]);
      brandRef.current.value = '';
    } catch (err) {
      alert(err?.response?.data?.detail || err.message);
    }
  };

  const createDosage = async (e) => {
    e.preventDefault();
    const brand_id = parseInt(dosageRef.current.dataset.brand || 0) || null;
    const label = dosageRef.current.value.trim();
    const default_instruction = instructionRef.current.value.trim();
    if (!label || !brand_id) return alert('Select brand and label');
    try {
      const created = await medicineService.createDosage({
        brand_id,
        label,
        default_instruction,
      });
      setDosages((c) => [...c, created]);
      dosageRef.current.value = '';
      instructionRef.current.value = '';
    } catch (err) {
      alert(err?.response?.data?.detail || err.message);
    }
  };

  // Simple CSV bulk import for dosages: csv rows -> brand_name,label,default_instruction
  const handleDosageCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      const [brandName, label, inst] = parts;
      const brand = brands.find(
        (b) => b.name.toLowerCase() === (brandName || '').toLowerCase()
      );
      if (!brand) continue;
      try {
        await medicineService.createDosage({
          brand_id: brand.id,
          label,
          default_instruction: inst || '',
        });
      } catch (err) {
        // ignore duplicates
      }
    }
    await loadAll();
    alert('Import complete');
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Medicine Master</h1>
          <p>Manage Drugs, Types, Brands and Dosages.</p>
        </div>
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/admin/config')}
        >
          Back
        </button>
      </header>

      <div className="admin-libraries">
        <section className="admin-panel library-panel">
          <div className="admin-section-title">
            <h2>Drugs</h2>
            <span>{drugs.length} items</span>
          </div>
          <form className="library-add-row" onSubmit={createDrug}>
            <input ref={drugRef} placeholder="New drug name" />
            <button className="btn-primary">Add Drug</button>
          </form>
          <div className="library-list">
            {drugs.map((d) => (
              <div key={d.id} className="library-item">
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel library-panel">
          <div className="admin-section-title">
            <h2>Types</h2>
            <span>{types.length} items</span>
          </div>
          <form className="library-add-row" onSubmit={createType}>
            <input ref={typeRef} placeholder="New type" />
            <button className="btn-primary">Add Type</button>
          </form>
          <div className="library-list">
            {types.map((t) => (
              <div key={t.id} className="library-item">
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel library-panel">
          <div className="admin-section-title">
            <h2>Brands</h2>
            <span>{brands.length} items</span>
          </div>
          <form className="library-add-row" onSubmit={createBrand}>
            <select
              onChange={(e) =>
                brandRef.current &&
                (brandRef.current.dataset.drug = e.target.value)
              }
            >
              <option value="">Select Drug</option>
              {drugs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input ref={brandRef} placeholder="Brand name" />
            <button className="btn-primary">Add Brand</button>
          </form>
          <div className="library-list">
            {brands.map((b) => (
              <div key={b.id} className="library-item">
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel library-panel">
          <div className="admin-section-title">
            <h2>Dosages</h2>
            <span>{dosages.length} items</span>
          </div>
          <form className="library-add-row" onSubmit={createDosage}>
            <select
              onChange={(e) =>
                dosageRef.current &&
                (dosageRef.current.dataset.brand = e.target.value)
              }
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <input ref={dosageRef} placeholder="Label e.g. 500 mg" />
            <input ref={instructionRef} placeholder="Default instruction" />
            <button className="btn-primary">Add Dosage</button>
            <input type="file" accept="text/csv" onChange={handleDosageCsv} />
          </form>
          <div className="library-list">
            {dosages.map((d) => (
              <div key={d.id} className="library-item">
                <span>
                  {d.label}{' '}
                  <small style={{ color: '#6b7280' }}>
                    {d.brand?.name || ''}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
