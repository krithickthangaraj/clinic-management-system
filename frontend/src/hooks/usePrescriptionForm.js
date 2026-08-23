import { useState, useCallback, useMemo } from 'react';

export const FREQUENCY_MULTIPLIERS = {
  'OD (1-0-0)': 1,
  '1-0-0': 1,
  'BD (1-0-1)': 2,
  '1-0-1': 2,
  'TDS (1-1-1)': 3,
  '1-1-1': 3,
  'QID (1-1-1-1)': 4,
  '1-1-1-1': 4,
  'HS (0-0-1)': 1,
  '0-0-1': 1,
  'SOS (As needed)': 1,
  'SOS': 1,
  'STAT (Immediately)': 1,
  'QW (Once weekly)': 1,
};

export const CLINICAL_TEMPLATES = {
  fever_viral: {
    name: 'Fever & Viral Protocol',
    diagnosis: 'Viral Pyrexia / Upper Respiratory Infection',
    complaints: [{ complaint: 'Fever with body ache & chills', duration: '3 days' }],
    investigations: ['CBC', 'Widal Test / Typhoid'],
    advice: 'Drink plenty of warm fluids, steam inhalation BD, complete rest for 2 days',
    medicines: [
      {
        brand_name: 'Dolo 650',
        drug_name: 'Paracetamol 650mg',
        dosage: '1 Tab',
        frequency: 'TDS (1-1-1)',
        days: 3,
        instructions: 'After food',
      },
      {
        brand_name: 'Cetcip',
        drug_name: 'Cetirizine 10mg',
        dosage: '1 Tab',
        frequency: 'HS (0-0-1)',
        days: 5,
        instructions: 'At bedtime',
      },
      {
        brand_name: 'Pan 40',
        drug_name: 'Pantoprazole 40mg',
        dosage: '1 Tab',
        frequency: 'OD (1-0-0)',
        days: 5,
        instructions: 'Empty stomach (Morning)',
      },
    ],
  },
  gastric_gerd: {
    name: 'Gastric & GERD Kit',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD) / Dyspepsia',
    complaints: [{ complaint: 'Heartburn, retrosternal burning, acid reflux', duration: '1 week' }],
    investigations: ['USG Abdomen', 'Serum Lipase / Amylase'],
    advice: 'Avoid spicy, oily food, eat smaller frequent meals, elevate head 30° during sleep',
    medicines: [
      {
        brand_name: 'Razo 20',
        drug_name: 'Rabeprazole 20mg',
        dosage: '1 Tab',
        frequency: 'OD (1-0-0)',
        days: 14,
        instructions: '30 mins before breakfast',
      },
      {
        brand_name: 'Mucaine Gel',
        drug_name: 'Oxetacaine + Aluminium Hydroxide',
        dosage: '10ml',
        frequency: 'TDS (1-1-1)',
        days: 7,
        instructions: '15 mins before food',
      },
      {
        brand_name: 'Ganaton',
        drug_name: 'Itopride 50mg',
        dosage: '1 Tab',
        frequency: 'TDS (1-1-1)',
        days: 7,
        instructions: 'Before food',
      },
    ],
  },
  hypertension: {
    name: 'Hypertension Maintenance',
    diagnosis: 'Essential Hypertension (Stage 1/2)',
    complaints: [{ complaint: 'Routine BP check / mild occipital headache', duration: '2 weeks' }],
    investigations: ['Lipid Profile', 'Serum Creatinine', 'ECG (12 Lead)'],
    advice: 'Low sodium diet (< 2g/day), 30 min brisk walk 5 days/week, regular BP log',
    medicines: [
      {
        brand_name: 'Telma 40',
        drug_name: 'Telmisartan 40mg',
        dosage: '1 Tab',
        frequency: 'OD (1-0-0)',
        days: 30,
        instructions: 'Morning after food',
      },
    ],
  },
  diabetes: {
    name: 'Type 2 Diabetes Kit',
    diagnosis: 'Type 2 Diabetes Mellitus',
    complaints: [{ complaint: 'Routine diabetic follow-up, polyuria', duration: '1 month' }],
    investigations: ['FBS / PPBS', 'HbA1c', 'Urine Microalbumin / Creatinine Ratio'],
    advice: 'Strict diabetic diet, avoid refined sugar & juices, daily foot inspection',
    medicines: [
      {
        brand_name: 'Glycomet GP 1',
        drug_name: 'Metformin 500mg + Glimepiride 1mg',
        dosage: '1 Tab',
        frequency: 'BD (1-0-1)',
        days: 30,
        instructions: 'With food (Breakfast & Dinner)',
      },
      {
        brand_name: 'Zomelis 50',
        drug_name: 'Vildagliptin 50mg',
        dosage: '1 Tab',
        frequency: 'BD (1-0-1)',
        days: 30,
        instructions: 'With food',
      },
    ],
  },
  bronchitis: {
    name: 'Acute Bronchitis & Cough',
    diagnosis: 'Acute Bronchitis / Tracheobronchitis',
    complaints: [{ complaint: 'Productive cough, chest tightness, throat irritation', duration: '5 days' }],
    investigations: ['Chest X-Ray PA', 'CBC with Absolute Eosinophil Count'],
    advice: 'Avoid cold beverages & dust exposure, warm saline gargles TDS, steam inhalation',
    medicines: [
      {
        brand_name: 'Augmentin 625',
        drug_name: 'Amoxicillin + Clavulanic Acid 625mg',
        dosage: '1 Tab',
        frequency: 'BD (1-0-1)',
        days: 5,
        instructions: 'After food',
      },
      {
        brand_name: 'Ascoril D',
        drug_name: 'Dextromethorphan + Phenylephrine',
        dosage: '10ml',
        frequency: 'TDS (1-1-1)',
        days: 5,
        instructions: 'After food',
      },
      {
        brand_name: 'Montair LC',
        drug_name: 'Montelukast 10mg + Levocetirizine 5mg',
        dosage: '1 Tab',
        frequency: 'HS (0-0-1)',
        days: 7,
        instructions: 'At bedtime',
      },
    ],
  },
  allergy_derma: {
    name: 'Skin Allergy / Dermatitis',
    diagnosis: 'Allergic Contact Dermatitis / Urticaria',
    complaints: [{ complaint: 'Generalized itchy rash, wheals, erythematous patches', duration: '2 days' }],
    investigations: ['Absolute Eosinophil Count (AEC)', 'Total Serum IgE'],
    advice: 'Avoid scratching, use syndet bar soap, apply calamine or emollients freely',
    medicines: [
      {
        brand_name: 'Allegra 120',
        drug_name: 'Fexofenadine 120mg',
        dosage: '1 Tab',
        frequency: 'OD (1-0-0)',
        days: 7,
        instructions: 'After food',
      },
      {
        brand_name: 'Momate Cream',
        drug_name: 'Mometasone Furoate 0.1%',
        dosage: '1 App',
        frequency: 'BD (1-0-1)',
        days: 7,
        instructions: 'Apply thin film over affected areas',
      },
    ],
  },
};

export function parseFrequencyMultiplier(freqStr = '') {
  if (!freqStr) return 1;
  if (FREQUENCY_MULTIPLIERS[freqStr]) return FREQUENCY_MULTIPLIERS[freqStr];

  const match = freqStr.match(/(\d+)-(\d+)-(\d+)(?:-(\d+))?/);
  if (match) {
    const d1 = parseInt(match[1], 10) || 0;
    const d2 = parseInt(match[2], 10) || 0;
    const d3 = parseInt(match[3], 10) || 0;
    const d4 = parseInt(match[4], 10) || 0;
    const sum = d1 + d2 + d3 + d4;
    return sum > 0 ? sum : 1;
  }
  return 1;
}

export function parseDosageMultiplier(dosageStr = '') {
  if (!dosageStr) return 1;
  const match = dosageStr.match(/^(\d+)\s*(tab|cap|pill|tablet|capsule)/i);
  if (match) {
    return parseInt(match[1], 10) || 1;
  }
  return 1;
}

export function calculateAutoQuantity(dosage, frequency, days) {
  const doseMultiplier = parseDosageMultiplier(dosage);
  const freqMultiplier = parseFrequencyMultiplier(frequency);
  const numDays = Math.max(1, parseInt(days, 10) || 1);
  return Math.max(1, doseMultiplier * freqMultiplier * numDays);
}

export function usePrescriptionForm(initialData = {}) {
  // 1. Clinical Assessment (Left Column)
  const [assessment, setAssessment] = useState({
    complaints: initialData.assessment?.complaints || [],
    duration: initialData.assessment?.duration || '',
    diagnosis: initialData.assessment?.diagnosis || [],
    examination: initialData.assessment?.examination || '',
  });

  // 2. Patient History Tags (Left Column)
  const [history, setHistory] = useState({
    past_history: initialData.history?.past_history || [],
    allergy_history: initialData.history?.allergy_history || [],
    personal_history: initialData.history?.personal_history || [],
    family_history: initialData.history?.family_history || [],
    surgical_history: initialData.history?.surgical_history || [],
  });

  // 3. RX Medication Table Rows (Center Column)
  const [medicines, setMedicines] = useState(
    initialData.medicines && initialData.medicines.length > 0
      ? initialData.medicines
      : [
          {
            s_no: 1,
            brand_name: '',
            drug_name: '',
            dosage: '1 Tab',
            frequency: 'TDS (1-1-1)',
            days: 5,
            instructions: 'After food',
            quantity: 15,
            manualQuantity: false,
          },
        ]
  );

  // 4. Clinical Plan, Labs & Billing (Right Column & Sticky Footer)
  const [planAndBilling, setPlanAndBilling] = useState({
    lab_reports_reviewed: initialData.plan_and_billing?.lab_reports_reviewed || '',
    investigations_next_visit: initialData.plan_and_billing?.investigations_next_visit || [],
    procedure: initialData.plan_and_billing?.procedure || '',
    referral: initialData.plan_and_billing?.referral || '',
    notes: initialData.plan_and_billing?.notes || '',
    advice: initialData.plan_and_billing?.advice || '',
    for_followup: Boolean(initialData.plan_and_billing?.for_followup),
    followup_duration: initialData.plan_and_billing?.followup_duration || 7,
    followup_unit: initialData.plan_and_billing?.followup_unit || 'Days',
    followup_date: initialData.plan_and_billing?.followup_date || '',
    doctor_fee: initialData.plan_and_billing?.doctor_fee || 0,
    dressing_fee: initialData.plan_and_billing?.dressing_fee || 0,
    procedure_fee: initialData.plan_and_billing?.procedure_fee || 0,
    payment_mode: initialData.plan_and_billing?.payment_mode || 'Cash',
    payment_status: initialData.plan_and_billing?.payment_status || 'paid',
  });

  // Dynamic Row Actions for RX Medication Table
  const addDrug = useCallback((drugPreset = null) => {
    setMedicines((prev) => {
      const nextSNo = prev.length + 1;
      const newRow = drugPreset
        ? {
            s_no: nextSNo,
            brand_name: drugPreset.brand_name || '',
            drug_name: drugPreset.drug_name || drugPreset.name || '',
            dosage: drugPreset.dosage || '1 Tab',
            frequency: drugPreset.frequency || 'TDS (1-1-1)',
            days: drugPreset.days || 5,
            instructions: drugPreset.instructions || 'After food',
            quantity: calculateAutoQuantity(
              drugPreset.dosage || '1 Tab',
              drugPreset.frequency || 'TDS (1-1-1)',
              drugPreset.days || 5
            ),
            manualQuantity: false,
          }
        : {
            s_no: nextSNo,
            brand_name: '',
            drug_name: '',
            dosage: '1 Tab',
            frequency: 'TDS (1-1-1)',
            days: 5,
            instructions: 'After food',
            quantity: 15,
            manualQuantity: false,
          };
      return [...prev, newRow];
    });
  }, []);

  const duplicateDrug = useCallback((index) => {
    setMedicines((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const target = prev[index];
      const duplicated = {
        ...target,
        s_no: prev.length + 1,
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicated);
      return updated.map((m, idx) => ({ ...m, s_no: idx + 1 }));
    });
  }, []);

  const moveDrug = useCallback((fromIndex, toIndex) => {
    setMedicines((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const copy = [...prev];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedItem);
      return copy.map((m, idx) => ({ ...m, s_no: idx + 1 }));
    });
  }, []);

  const removeDrug = useCallback((index) => {
    setMedicines((prev) => {
      if (prev.length <= 1) {
        return [
          {
            s_no: 1,
            brand_name: '',
            drug_name: '',
            dosage: '1 Tab',
            frequency: 'TDS (1-1-1)',
            days: 5,
            instructions: 'After food',
            quantity: 15,
            manualQuantity: false,
          },
        ];
      }
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, idx) => ({ ...item, s_no: idx + 1 }));
    });
  }, []);

  const updateDrug = useCallback((index, field, value) => {
    setMedicines((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };

      if (field === 'dosage' || field === 'frequency' || field === 'days') {
        if (!row.manualQuantity) {
          row.quantity = calculateAutoQuantity(
            field === 'dosage' ? value : row.dosage,
            field === 'frequency' ? value : row.frequency,
            field === 'days' ? value : row.days
          );
        }
      } else if (field === 'quantity') {
        row.manualQuantity = true;
      }

      copy[index] = row;
      return copy;
    });
  }, []);

  const applyMasterDrug = useCallback((index, masterDrug) => {
    setMedicines((prev) => {
      const copy = [...prev];
      if (index < 0 || index >= copy.length) return prev;
      const dosage = masterDrug.default_dosage || masterDrug.dosage || '1 Tab';
      const frequency = masterDrug.default_frequency || masterDrug.frequency || 'TDS (1-1-1)';
      const days = parseInt(masterDrug.default_days ?? masterDrug.days, 10) || 3;
      const instructions =
        masterDrug.default_instructions !== undefined
          ? masterDrug.default_instructions
          : masterDrug.instructions || 'After food';
      const quantity = calculateAutoQuantity(dosage, frequency, days);

      copy[index] = {
        ...copy[index],
        brand_name: masterDrug.brand_name || '',
        drug_name: masterDrug.drug_name || masterDrug.name || '',
        dosage,
        frequency,
        days,
        instructions,
        quantity,
        manualQuantity: false,
      };
      return copy;
    });
  }, []);

  // 1-Click Prescription Template Loader
  const loadTemplate = useCallback((templateKey) => {
    const template = CLINICAL_TEMPLATES[templateKey];
    if (!template) return;

    // 1. Populate assessment diagnosis & complaints
    if (template.diagnosis) {
      setAssessment((prev) => {
        const currentDiags = prev.diagnosis || [];
        const newDiag = template.diagnosis;
        return {
          ...prev,
          diagnosis: currentDiags.includes(newDiag)
            ? currentDiags
            : [...currentDiags, newDiag],
          complaints: [
            ...(prev.complaints || []),
            ...(template.complaints || []),
          ],
        };
      });
    }

    // 2. Populate investigations & advice
    if (template.investigations || template.advice) {
      setPlanAndBilling((prev) => ({
        ...prev,
        investigations_next_visit: Array.from(
          new Set([...(prev.investigations_next_visit || []), ...(template.investigations || [])])
        ),
        advice: prev.advice
          ? `${prev.advice}. ${template.advice || ''}`.trim()
          : template.advice || '',
      }));
    }

    // 3. Populate RX Medicines
    if (template.medicines && template.medicines.length > 0) {
      const templateDrugs = template.medicines.map((m, idx) => ({
        s_no: idx + 1,
        brand_name: m.brand_name || '',
        drug_name: m.drug_name || '',
        dosage: m.dosage || '1 Tab',
        frequency: m.frequency || 'TDS (1-1-1)',
        days: m.days || 5,
        instructions: m.instructions || 'After food',
        quantity: calculateAutoQuantity(
          m.dosage || '1 Tab',
          m.frequency || 'TDS (1-1-1)',
          m.days || 5
        ),
        manualQuantity: false,
      }));
      setMedicines(templateDrugs);
    }
  }, []);

  // History Tags Handlers
  const addHistoryTag = useCallback((section, tag) => {
    const trimmed = (tag || '').trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const list = prev[section] || [];
      if (list.includes(trimmed)) return prev;
      return { ...prev, [section]: [...list, trimmed] };
    });
  }, []);

  const removeHistoryTag = useCallback((section, tag) => {
    setHistory((prev) => ({
      ...prev,
      [section]: (prev[section] || []).filter((t) => t !== tag),
    }));
  }, []);

  // Next Visit Investigations Handlers
  const addInvestigationTag = useCallback((tag) => {
    const trimmed = (tag || '').trim();
    if (!trimmed) return;
    setPlanAndBilling((prev) => {
      const list = prev.investigations_next_visit || [];
      if (list.includes(trimmed)) return prev;
      return { ...prev, investigations_next_visit: [...list, trimmed] };
    });
  }, []);

  const removeInvestigationTag = useCallback((tag) => {
    setPlanAndBilling((prev) => ({
      ...prev,
      investigations_next_visit: (prev.investigations_next_visit || []).filter(
        (t) => t !== tag
      ),
    }));
  }, []);

  // Total amount auto-calculation
  const totalAmount = useMemo(() => {
    const doc = parseFloat(planAndBilling.doctor_fee) || 0;
    const dress = parseFloat(planAndBilling.dressing_fee) || 0;
    const proc = parseFloat(planAndBilling.procedure_fee) || 0;
    return doc + dress + proc;
  }, [
    planAndBilling.doctor_fee,
    planAndBilling.dressing_fee,
    planAndBilling.procedure_fee,
  ]);

  return {
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
    applyMasterDrug,
    loadTemplate,
    planAndBilling,
    setPlanAndBilling,
    addInvestigationTag,
    removeInvestigationTag,
    totalAmount,
  };
}
