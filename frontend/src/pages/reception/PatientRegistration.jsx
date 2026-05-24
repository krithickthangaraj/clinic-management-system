import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { visitService } from '../../services/visitService';
import { vitalsService } from '../../services/vitalsService';
import './PatientRegistration.css';

const STATUS_LABELS = {
  registered: 'Vitals',
  vitals_done: 'In queue',
  in_consultation: 'With doctor',
  consulted: 'Seen',
  completed: 'Done',
};
const PENDING = ['registered'];
const IN_QUEUE = ['vitals_done'];
const ALREADY_SEEN = ['in_consultation', 'consulted', 'completed'];

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitId, setVisitId] = useState(null);
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [todayVisits, setTodayVisits] = useState([]);
  const [todayFilter, setTodayFilter] = useState('in_queue'); // 'in_queue' | 'pending' | 'already_seen' | 'all'
  const [loadingToday, setLoadingToday] = useState(false);

  const [reg, setReg] = useState({
    name: '',
    guardian_name: '',
    phone: '',
    age_years: '',
    age_months: '0',
    dob: '',
    gender: 'male',
    address: '',
  });
  const [vitals, setVitals] = useState({
    temp_f: '',
    bp_systolic: '',
    bp_diastolic: '',
    pr: '',
    spo2: '',
    sugar: '',
    height_cm: '',
    weight_kg: '',
  });
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Search with debounce
  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await patientService.search(searchQ);
        setSearchResults(Array.isArray(list) ? list : []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const fetchToday = async () => {
    setLoadingToday(true);
    try {
      const list = await visitService.getReceptionToday();
      setTodayVisits(Array.isArray(list) ? list : []);
    } catch {
      setTodayVisits([]);
    }
    setLoadingToday(false);
  };

  useEffect(() => {
    fetchToday();
  }, []);
  useEffect(() => {
    const id = setInterval(fetchToday, 12000);
    return () => clearInterval(id);
  }, []);

  const filteredToday = todayVisits.filter((v) => {
    if (todayFilter === 'all') return true;
    if (todayFilter === 'in_queue') return IN_QUEUE.includes(v.status);
    if (todayFilter === 'pending') return PENDING.includes(v.status);
    if (todayFilter === 'already_seen') return ALREADY_SEEN.includes(v.status);
    return true;
  });

  const countInQueue = todayVisits.filter((v) =>
    IN_QUEUE.includes(v.status)
  ).length;
  const countPending = todayVisits.filter((v) =>
    PENDING.includes(v.status)
  ).length;
  const countAlreadySeen = todayVisits.filter((v) =>
    ALREADY_SEEN.includes(v.status)
  ).length;

  const formatTime = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const bmi =
    vitals.weight_kg && vitals.height_cm
      ? (
          parseFloat(vitals.weight_kg) /
          Math.pow(parseFloat(vitals.height_cm) / 100, 2)
        ).toFixed(1)
      : '—';

  const handleRegChange = (e) => {
    setReg({ ...reg, [e.target.name]: e.target.value });
  };
  const handleVitalsChange = (e) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };

  const hasAnyVitals = () =>
    [
      vitals.temp_f,
      vitals.bp_systolic,
      vitals.bp_diastolic,
      vitals.pr,
      vitals.spo2,
      vitals.sugar,
      vitals.height_cm,
      vitals.weight_kg,
    ].some((v) => v !== '' && v != null);

  const buildVitalsPayload = (vid) => {
    const tempC = vitals.temp_f
      ? ((parseFloat(vitals.temp_f) - 32) * 5) / 9
      : null;
    return {
      visit_id: vid,
      temperature: tempC,
      bp_systolic: vitals.bp_systolic ? parseInt(vitals.bp_systolic) : null,
      bp_diastolic: vitals.bp_diastolic ? parseInt(vitals.bp_diastolic) : null,
      pr: vitals.pr ? parseInt(vitals.pr) : null,
      spo2: vitals.spo2 ? parseInt(vitals.spo2) : null,
      sugar: vitals.sugar ? parseFloat(vitals.sugar) : null,
      height_cm: vitals.height_cm ? parseFloat(vitals.height_cm) : null,
      weight: vitals.weight_kg ? parseFloat(vitals.weight_kg) : null,
    };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await patientService.register({
        name: reg.name,
        guardian_name: reg.guardian_name || null,
        phone: reg.phone,
        age_years: parseInt(reg.age_years) || 0,
        age_months: parseInt(reg.age_months) || 0,
        gender: reg.gender,
        address: reg.address || null,
      });
      setVisitId(res.visit.id);
      if (hasAnyVitals()) {
        try {
          await vitalsService.create(buildVitalsPayload(res.visit.id));
        } catch (vErr) {
          setError(vErr.response?.data?.detail || 'Vitals save failed');
          setLoading(false);
          return;
        }
      }
      setVitalsSaved(true);
      fetchToday();
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    if (!visitId) return;
    setError('');
    setLoading(true);
    try {
      await vitalsService.create(buildVitalsPayload(visitId));
      setVitalsSaved(true);
      fetchToday();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save vitals');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !patientDetails) return;
    setError('');
    setLoading(true);
    try {
      await patientService.update(selectedPatient.id, {
        name: reg.name,
        guardian_name: reg.guardian_name || null,
        phone: reg.phone,
        age_years: parseInt(reg.age_years) || 0,
        age_months: parseInt(reg.age_months) || 0,
        gender: reg.gender,
        address: reg.address || null,
      });
      if (hasAnyVitals()) {
        let vid = visitId;
        if (!vid) {
          const v = await visitService.createForPatient(selectedPatient.id);
          vid = v.id;
        }
        await vitalsService.create(buildVitalsPayload(vid));
      }
      setVitalsSaved(true);
      fetchToday();
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForNext = () => {
    setSearchQ('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPatientDetails(null);
    setVisitId(null);
    setVitalsSaved(false);
    setReg({
      name: '',
      guardian_name: '',
      phone: '',
      age_years: '',
      age_months: '0',
      gender: 'male',
      address: '',
    });
    setVitals({
      temp_f: '',
      bp_systolic: '',
      bp_diastolic: '',
      pr: '',
      spo2: '',
      sugar: '',
      height_cm: '',
      weight_kg: '',
    });
    setError('');
    fetchToday();
  };

  // Load full patient + latest vitals when existing patient is selected
  useEffect(() => {
    if (!selectedPatient) {
      setPatientDetails(null);
      return;
    }
    let cancelled = false;
    setLoadingDetails(true);
    setPatientDetails(null);
    const load = async () => {
      try {
        const { patient, history } = await patientService.getHistory(
          selectedPatient.id
        );
        if (cancelled) return;
        setPatientDetails(patient);
        const latest = history?.[0]?.vitals;
        if (latest) {
          const tempF =
            latest.temperature != null
              ? String(((latest.temperature * 9) / 5 + 32).toFixed(1))
              : '';
          setVitals({
            temp_f: tempF,
            bp_systolic:
              latest.bp_systolic != null ? String(latest.bp_systolic) : '',
            bp_diastolic:
              latest.bp_diastolic != null ? String(latest.bp_diastolic) : '',
            pr: latest.pr != null ? String(latest.pr) : '',
            spo2: latest.spo2 != null ? String(latest.spo2) : '',
            sugar: latest.sugar != null ? String(latest.sugar) : '',
            height_cm: latest.height_cm != null ? String(latest.height_cm) : '',
            weight_kg: latest.weight != null ? String(latest.weight) : '',
          });
        } else {
          setVitals({
            temp_f: '',
            bp_systolic: '',
            bp_diastolic: '',
            pr: '',
            spo2: '',
            sugar: '',
            height_cm: '',
            weight_kg: '',
          });
        }
        setReg({
          name: patient.name || '',
          guardian_name: patient.guardian_name || '',
          phone: patient.phone || '',
          age_years: patient.age_years != null ? String(patient.age_years) : '',
          age_months:
            patient.age_months != null ? String(patient.age_months) : '0',
          gender: patient.gender || 'male',
          address: patient.address || '',
        });
      } catch {
        if (!cancelled) setPatientDetails(null);
      }
      if (!cancelled) setLoadingDetails(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedPatient?.id]);

  return (
    <div className="reception-page">
      <div className="reception-layout">
        {/* Left: Today's patients (live) */}
        <aside className="reception-left">
          <div className="card today-card">
            <h3 className="today-title">Today&apos;s Patients</h3>
            <div className="today-tabs">
              <button
                type="button"
                className={`today-tab ${todayFilter === 'in_queue' ? 'active' : ''}`}
                onClick={() => setTodayFilter('in_queue')}
              >
                In Queue <span className="today-count">({countInQueue})</span>
              </button>
              <button
                type="button"
                className={`today-tab ${todayFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setTodayFilter('pending')}
              >
                Pending <span className="today-count">({countPending})</span>
              </button>
              <button
                type="button"
                className={`today-tab ${todayFilter === 'already_seen' ? 'active' : ''}`}
                onClick={() => setTodayFilter('already_seen')}
              >
                Already Seen{' '}
                <span className="today-count">({countAlreadySeen})</span>
              </button>
              <button
                type="button"
                className={`today-tab ${todayFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTodayFilter('all')}
              >
                All <span className="today-count">({todayVisits.length})</span>
              </button>
            </div>
            <div className="today-list">
              {loadingToday && filteredToday.length === 0 ? (
                <p className="today-empty">Loading…</p>
              ) : filteredToday.length === 0 ? (
                <p className="today-empty">No patients yet today</p>
              ) : (
                <ul className="today-visits">
                  {filteredToday.map((v) => (
                    <li
                      key={v.id}
                      className="today-item today-item-clickable"
                      onClick={() => {
                        setSelectedPatient({
                          id: v.patient_id,
                          name: v.patient_name || `#${v.patient_id}`,
                        });
                        setVisitId(v.id);
                        setSearchResults([]);
                      }}
                    >
                      <div className="today-item-main">
                        <span className="today-name">
                          {v.patient_name || `#${v.patient_id}`}
                        </span>
                        <span className="today-badge" data-status={v.status}>
                          {STATUS_LABELS[v.status] || v.status}
                        </span>
                      </div>
                      <div className="today-item-meta">
                        <span className="today-visit-num">
                          {v.visit_number}
                        </span>
                        <span className="today-time">
                          {formatTime(v.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* Right: Register form */}
        <main className="reception-right">
          <header className="page-header">
            <h1>Register &amp; Vitals</h1>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-back"
            >
              Dashboard
            </button>
          </header>

          {/* Search — before register */}
          <section className="card search-section">
            <label className="search-label">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Patient ID, Name or Contact..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="search-input"
              />
            </label>
            {searching && <span className="search-hint">Searching...</span>}
            {searchResults.length > 0 && !selectedPatient && !visitId && (
              <ul className="search-results">
                {searchResults.map((p) => (
                  <li
                    key={p.id}
                    className="search-item"
                    onClick={() => {
                      setSelectedPatient(p);
                      setSearchResults([]);
                      setSearchQ('');
                    }}
                  >
                    <span className="item-id">#{p.id}</span>
                    <span className="item-name">{p.name}</span>
                    <span className="item-phone">{p.phone}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && <div className="error-message">{error}</div>}

          {/* Existing: loading full details */}
          {selectedPatient && loadingDetails && (
            <section className="card form-grid">
              <p className="loading-details">Loading patient details…</p>
            </section>
          )}

          {/* Existing: load failed */}
          {selectedPatient && !loadingDetails && !patientDetails && (
            <section className="card form-grid">
              <p className="loading-details">Could not load patient.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientDetails(null);
                  setVisitId(null);
                }}
                className="btn-ghost"
              >
                Choose Another
              </button>
            </section>
          )}

          {/* Edit: existing patient with full form (registration + vitals) */}
          {selectedPatient && patientDetails && !vitalsSaved && (
            <form onSubmit={handleUpdate} className="card form-grid">
              <div className="form-head-row">
                <h3>Edit Patient</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setPatientDetails(null);
                    setVisitId(null);
                  }}
                  className="btn-ghost btn-sm"
                >
                  Choose Another
                </button>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Patient Name *</label>
                  <input
                    name="name"
                    value={reg.name}
                    onChange={handleRegChange}
                    required
                    placeholder="Full name"
                  />
                </div>
                <div className="field">
                  <label>Guardian Name</label>
                  <input
                    name="guardian_name"
                    value={reg.guardian_name}
                    onChange={handleRegChange}
                    placeholder="Guardian"
                  />
                </div>
              </div>
              <div className="field">
                <label>Age / DOB *</label>
                <AgeDobInput
                  mode={reg.dob_mode || 'age'}
                  ageYears={reg.age_years}
                  ageMonths={reg.age_months}
                  dob={reg.dob}
                  onModeChange={(mode) => setReg({ ...reg, dob_mode: mode })}
                  onAgeChange={(years, months) =>
                    setReg({ ...reg, age_years: years, age_months: months })
                  }
                  onDobChange={(dob) => setReg({ ...reg, dob: dob })}
                />
              </div>
              <div className="field">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={reg.gender}
                  onChange={handleRegChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Contact Number *</label>
                <input
                  name="phone"
                  type="tel"
                  value={reg.phone}
                  onChange={handleRegChange}
                  required
                  placeholder="10 digits"
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label>Address</label>
                <input
                  name="address"
                  value={reg.address}
                  onChange={handleRegChange}
                  placeholder="Address"
                />
              </div>
              <h3 className="vitals-subheading">Vitals</h3>
              <div className="vitals-row">
                <div className="field">
                  <label>Temp (°F)</label>
                  <input
                    name="temp_f"
                    type="number"
                    step="0.1"
                    value={vitals.temp_f}
                    onChange={handleVitalsChange}
                    placeholder="98.6"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>BP (mmHg)</label>
                  <div className="bp-input">
                    <input
                      name="bp_systolic"
                      type="number"
                      value={vitals.bp_systolic}
                      onChange={handleVitalsChange}
                      placeholder="120"
                    />
                    <span className="bp-sep">/</span>
                    <input
                      name="bp_diastolic"
                      type="number"
                      value={vitals.bp_diastolic}
                      onChange={handleVitalsChange}
                      placeholder="80"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>PR (bpm)</label>
                  <input
                    name="pr"
                    type="number"
                    value={vitals.pr}
                    onChange={handleVitalsChange}
                    placeholder="72"
                    inputMode="numeric"
                  />
                </div>
                <div className="field">
                  <label>SpO₂ (%)</label>
                  <input
                    name="spo2"
                    type="number"
                    min="0"
                    max="100"
                    value={vitals.spo2}
                    onChange={handleVitalsChange}
                    placeholder="98"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="vitals-row vitals-row-4">
                <div className="field">
                  <label>RBS (Random Blood Sugar)</label>
                  <input
                    name="sugar"
                    type="number"
                    step="0.1"
                    value={vitals.sugar}
                    onChange={handleVitalsChange}
                    placeholder="100"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>Height (cm)</label>
                  <input
                    name="height_cm"
                    type="number"
                    step="0.1"
                    value={vitals.height_cm}
                    onChange={handleVitalsChange}
                    placeholder="170"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>Weight (kg)</label>
                  <input
                    name="weight_kg"
                    type="number"
                    step="0.1"
                    value={vitals.weight_kg}
                    onChange={handleVitalsChange}
                    placeholder="70"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>BMI (kg/m²)</label>
                  <div className="bmi-readonly">{bmi}</div>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Update'}
              </button>
            </form>
          )}

          {/* New: Register form + Vitals below (all vitals optional) */}
          {!selectedPatient && !visitId && !vitalsSaved && (
            <form onSubmit={handleRegister} className="card form-grid">
              <h3>New Patient</h3>
              <div className="grid-2">
                <div className="field">
                  <label>Patient Name *</label>
                  <input
                    name="name"
                    value={reg.name}
                    onChange={handleRegChange}
                    required
                    placeholder="Full name"
                  />
                </div>
                <div className="field">
                  <label>Guardian Name</label>
                  <input
                    name="guardian_name"
                    value={reg.guardian_name}
                    onChange={handleRegChange}
                    placeholder="Guardian"
                  />
                </div>
              </div>
              <div className="field">
                <label>Age / DOB *</label>
                <AgeDobInput
                  mode={reg.dob_mode || 'age'}
                  ageYears={reg.age_years}
                  ageMonths={reg.age_months}
                  dob={reg.dob}
                  onModeChange={(mode) => setReg({ ...reg, dob_mode: mode })}
                  onAgeChange={(years, months) =>
                    setReg({ ...reg, age_years: years, age_months: months })
                  }
                  onDobChange={(dob) => setReg({ ...reg, dob: dob })}
                />
              </div>
              <div className="field">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={reg.gender}
                  onChange={handleRegChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Contact Number *</label>
                <input
                  name="phone"
                  type="tel"
                  value={reg.phone}
                  onChange={handleRegChange}
                  required
                  placeholder="10 digits"
                  inputMode="numeric"
                />
              </div>
              <div className="field">
                <label>Address</label>
                <input
                  name="address"
                  value={reg.address}
                  onChange={handleRegChange}
                  placeholder="Address"
                />
              </div>
              <h3 className="vitals-subheading">Vitals</h3>
              <div className="vitals-row">
                <div className="field">
                  <label>Temp (°F)</label>
                  <input
                    name="temp_f"
                    type="number"
                    step="0.1"
                    value={vitals.temp_f}
                    onChange={handleVitalsChange}
                    placeholder="98.6"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>BP (mmHg)</label>
                  <div className="bp-input">
                    <input
                      name="bp_systolic"
                      type="number"
                      value={vitals.bp_systolic}
                      onChange={handleVitalsChange}
                      placeholder="120"
                    />
                    <span className="bp-sep">/</span>
                    <input
                      name="bp_diastolic"
                      type="number"
                      value={vitals.bp_diastolic}
                      onChange={handleVitalsChange}
                      placeholder="80"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>PR (bpm)</label>
                  <input
                    name="pr"
                    type="number"
                    value={vitals.pr}
                    onChange={handleVitalsChange}
                    placeholder="72"
                    inputMode="numeric"
                  />
                </div>
                <div className="field">
                  <label>SpO₂ (%)</label>
                  <input
                    name="spo2"
                    type="number"
                    min="0"
                    max="100"
                    value={vitals.spo2}
                    onChange={handleVitalsChange}
                    placeholder="98"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="vitals-row vitals-row-4">
                <div className="field">
                  <label>RBS (Random Blood Sugar)</label>
                  <input
                    name="sugar"
                    type="number"
                    step="0.1"
                    value={vitals.sugar}
                    onChange={handleVitalsChange}
                    placeholder="100"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>Height (cm)</label>
                  <input
                    name="height_cm"
                    type="number"
                    step="0.1"
                    value={vitals.height_cm}
                    onChange={handleVitalsChange}
                    placeholder="170"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>Weight (kg)</label>
                  <input
                    name="weight_kg"
                    type="number"
                    step="0.1"
                    value={vitals.weight_kg}
                    onChange={handleVitalsChange}
                    placeholder="70"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>BMI (kg/m²)</label>
                  <div className="bmi-readonly">{bmi}</div>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Registering…' : 'Register'}
              </button>
            </form>
          )}

          {/* Vitals only — new patient when vitals save failed (retry) */}
          {visitId && !vitalsSaved && (
            <form onSubmit={handleSaveVitals} className="card vitals-grid">
              <h3>Vitals</h3>
              <div className="vitals-row">
                <div className="field">
                  <label>Temp (°F)</label>
                  <input
                    name="temp_f"
                    type="number"
                    step="0.1"
                    value={vitals.temp_f}
                    onChange={handleVitalsChange}
                    placeholder="98.6"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>BP (mmHg)</label>
                  <div className="bp-input">
                    <input
                      name="bp_systolic"
                      type="number"
                      value={vitals.bp_systolic}
                      onChange={handleVitalsChange}
                      placeholder="120"
                    />
                    <span className="bp-sep">/</span>
                    <input
                      name="bp_diastolic"
                      type="number"
                      value={vitals.bp_diastolic}
                      onChange={handleVitalsChange}
                      placeholder="80"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>PR (bpm)</label>
                  <input
                    name="pr"
                    type="number"
                    value={vitals.pr}
                    onChange={handleVitalsChange}
                    placeholder="72"
                    inputMode="numeric"
                  />
                </div>
                <div className="field">
                  <label>SpO₂ (%)</label>
                  <input
                    name="spo2"
                    type="number"
                    min="0"
                    max="100"
                    value={vitals.spo2}
                    onChange={handleVitalsChange}
                    placeholder="98"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="vitals-row vitals-row-4">
                <div className="field">
                  <label>RBS (Random Blood Sugar)</label>
                  <input
                    name="sugar"
                    type="number"
                    step="0.1"
                    value={vitals.sugar}
                    onChange={handleVitalsChange}
                    placeholder="100"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>Height (cm)</label>
                  <input
                    name="height_cm"
                    type="number"
                    step="0.1"
                    value={vitals.height_cm}
                    onChange={handleVitalsChange}
                    placeholder="170"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>Weight (kg)</label>
                  <input
                    name="weight_kg"
                    type="number"
                    step="0.1"
                    value={vitals.weight_kg}
                    onChange={handleVitalsChange}
                    placeholder="70"
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label>BMI (kg/m²)</label>
                  <div className="bmi-readonly">{bmi}</div>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Vitals'}
              </button>
            </form>
          )}

          {vitalsSaved && (
            <section className="card done-card">
              <h3>✓ Done</h3>
              <p>Saved.</p>
              <button
                type="button"
                onClick={resetForNext}
                className="btn-primary"
              >
                Register Next
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
