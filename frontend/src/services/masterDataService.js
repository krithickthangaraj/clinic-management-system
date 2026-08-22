/**
 * Master Data Service
 * Provides centralized dictionary management across all clinical fields.
 * Persists locally and allows adding, editing, and deleting items.
 */

const DEFAULT_MASTER_DATA = {
  complaints: [
    'Fever',
    'Cough',
    'Cold & Runny Nose',
    'Headache',
    'Body Ache & Fatigue',
    'Throat Pain',
    'Abdominal Pain',
    'Vomiting',
    'Diarrhea',
    'Chest Pain',
    'Breathlessness',
    'Joint Pain',
    'Skin Rash & Itching',
    'Burning Micturition',
    'Loss of Appetite',
  ],
  durations: [
    '1 day',
    '2 days',
    '3 days',
    '5 days',
    '1 week',
    '10 days',
    '2 weeks',
    '1 month',
    '3 months',
    'Since yesterday',
  ],
  diagnoses: [
    'Upper Respiratory Infection',
    'Acute Bronchitis',
    'Viral Pyrexia',
    'Gastroenteritis',
    'Type 2 Diabetes Mellitus',
    'Essential Hypertension',
    'Dyspepsia / GERD',
    'Migraine',
    'Urinary Tract Infection (UTI)',
    'Allergic Dermatitis',
    'Osteoarthritis',
    'Bronchial Asthma',
  ],
  investigations: [
    'CBC',
    'HbA1c',
    'Lipid Profile',
    'LFT (Liver Function Test)',
    'RFT / Serum Creatinine',
    'FBS / PPBS',
    'USG Abdomen & Pelvis',
    'ECG (12 Lead)',
    'Chest X-Ray PA',
    'Urine Routine & Microscopy',
    'Thyroid Profile (TSH)',
    'Serum Electrolytes',
    'Widal Test',
    'Total Serum IgE',
  ],
  procedures: [
    'Wound Dressing',
    'Nebulization',
    'Suturing & Closure',
    'Incision & Drainage (I&D)',
    'Ear Syringing',
    'Foreign Body Removal',
    'Catheterization',
    'Intramuscular Injection (IM)',
    'Intravenous Cannulation (IV)',
  ],
  referrals: [
    'Cardiologist (Echo evaluation)',
    'ENT Specialist',
    'Orthopedic Surgeon',
    'General Surgeon',
    'Dermatologist',
    'Neurologist',
    'Ophthalmologist',
    'Pulmonologist',
    'Physiotherapist',
  ],
  advice: [
    'Drink plenty of warm fluids & stay hydrated',
    'Low salt diet (< 2g/day) & avoid fried foods',
    'Strict diabetic diet (avoid sweets and juices)',
    'Steam inhalation twice daily',
    'Warm saline gargles three times daily',
    'Rest for 2 days & avoid heavy lifting',
    'Elevate headrest while sleeping',
    'Apply moisturizer liberally after bathing',
  ],
};

const STORAGE_KEY = 'clinic_global_master_data_v1';

export const masterDataService = {
  getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_MASTER_DATA, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_MASTER_DATA;
  },

  getCategory(category) {
    const all = this.getAll();
    return all[category] || DEFAULT_MASTER_DATA[category] || [];
  },

  addItem(category, item) {
    const trimmed = (item || '').trim();
    if (!trimmed) return;
    const all = this.getAll();
    const list = all[category] || [];
    if (!list.includes(trimmed)) {
      all[category] = [trimmed, ...list];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {}
    }
  },

  updateItem(category, oldItem, newItem) {
    const trimmed = (newItem || '').trim();
    if (!trimmed) return;
    const all = this.getAll();
    const list = all[category] || [];
    const idx = list.indexOf(oldItem);
    if (idx !== -1) {
      list[idx] = trimmed;
      all[category] = [...list];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {}
    }
  },

  deleteItem(category, item) {
    const all = this.getAll();
    const list = all[category] || [];
    all[category] = list.filter((t) => t !== item);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}
  },
};
