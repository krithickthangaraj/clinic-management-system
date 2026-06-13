const VITAL_FIELDS = [
  'bp_systolic',
  'bp_diastolic',
  'temperature',
  'weight',
  'height_cm',
  'pr',
  'spo2',
  'sugar',
];

const cleanText = (value) => String(value || '').trim();

export const cleanTextArray = (values = []) => {
  const seen = new Set();
  return values
    .map(cleanText)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const cleanVitals = (vitals = {}) => {
  const cleaned = {};
  VITAL_FIELDS.forEach((field) => {
    if (vitals?.[field] !== undefined) {
      cleaned[field] = vitals[field];
    }
  });
  return cleaned;
};

export const cleanMedicines = (medicines = []) =>
  medicines
    .filter((medicine) => cleanText(medicine?.drug_name))
    .map((medicine) => ({
      drug_name: cleanText(medicine.drug_name),
      dosage: medicine.dosage || '',
      frequency: medicine.frequency || '',
      instructions: medicine.instructions || null,
      start_date: medicine.start_date || null,
      number_of_days: Number(medicine.number_of_days) || 1,
      end_date: medicine.end_date || null,
      quantity: Number(medicine.quantity) || 0,
    }));

export const cleanTests = (tests = []) =>
  tests
    .filter((test) => cleanText(test?.test_name || test?.name))
    .map((test) => ({
      test_name: cleanText(test.test_name || test.name),
      test_type: test.test_type || 'Lab',
      status: test.status || 'ordered',
    }));

export const buildTemplatePayload = ({
  name,
  complaints = [],
  diagnosis = [],
  advice = [],
  medicines = [],
  vitals = {},
  tests = [],
  followUpDate = '',
  followUpNotes = '',
}) => ({
  name: cleanText(name),
  chief_complaints: cleanTextArray(complaints),
  diagnosis: cleanTextArray(diagnosis).join(', '),
  advice: cleanTextArray(advice).join(', '),
  drugs: cleanMedicines(medicines),
  vitals: cleanVitals(vitals),
  tests: cleanTests(tests),
  follow_up_date: followUpDate || null,
  follow_up_notes: cleanText(followUpNotes),
});
