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

export function parseFrequencyMultiplier(freqStr = '') {
  if (!freqStr) return 1;
  if (FREQUENCY_MULTIPLIERS[freqStr]) return FREQUENCY_MULTIPLIERS[freqStr];

  // Try extracting pattern like 1-1-1 or 1-0-1
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
  // 1. Clinical Assessment
  const [assessment, setAssessment] = useState({
    complaints: initialData.assessment?.complaints || [],
    duration: initialData.assessment?.duration || '',
    diagnosis: initialData.assessment?.diagnosis || [],
    examination: initialData.assessment?.examination || '',
  });

  // 2. Patient History Tags
  const [history, setHistory] = useState({
    past_history: initialData.history?.past_history || [],
    allergy_history: initialData.history?.allergy_history || [],
    personal_history: initialData.history?.personal_history || [],
    family_history: initialData.history?.family_history || [],
    surgical_history: initialData.history?.surgical_history || [],
  });

  // 3. RX Medication Table Rows
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

  // 4. Plan & Billing
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

  const removeDrug = useCallback((index) => {
    setMedicines((prev) => {
      if (prev.length <= 1) {
        // Keep at least one empty row
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
      // Re-index s_no
      return filtered.map((item, idx) => ({ ...item, s_no: idx + 1 }));
    });
  }, []);

  const updateDrug = useCallback((index, field, value) => {
    setMedicines((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };

      // Handle Auto-Calculation when dosage, frequency, or days change (unless manually locked)
      if (field === 'dosage' || field === 'frequency' || field === 'days') {
        if (!row.manualQuantity) {
          row.quantity = calculateAutoQuantity(
            field === 'dosage' ? value : row.dosage,
            field === 'frequency' ? value : row.frequency,
            field === 'days' ? value : row.days
          );
        }
      } else if (field === 'quantity') {
        // User manually entered quantity -> flag manualQuantity = true
        row.manualQuantity = true;
      }

      copy[index] = row;
      return copy;
    });
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

  // Total amount auto-calculation
  const totalAmount = useMemo(() => {
    const doc = parseFloat(planAndBilling.doctor_fee) || 0;
    const dress = parseFloat(planAndBilling.dressing_fee) || 0;
    const proc = parseFloat(planAndBilling.procedure_fee) || 0;
    return doc + dress + proc;
  }, [planAndBilling.doctor_fee, planAndBilling.dressing_fee, planAndBilling.procedure_fee]);

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
    removeDrug,
    updateDrug,
    planAndBilling,
    setPlanAndBilling,
    totalAmount,
  };
}
