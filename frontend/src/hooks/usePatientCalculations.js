import { useMemo } from 'react';

/**
 * Calculates Age (years, months, days) from a given DOB string (YYYY-MM-DD).
 */
export function calculateAgeFromDob(dobString) {
  if (!dobString) return { age: '', age_format: 'Years', years: 0, months: 0, days: 0 };
  
  const dob = new Date(dobString + 'T00:00:00');
  if (isNaN(dob.getTime())) return { age: '', age_format: 'Years', years: 0, months: 0, days: 0 };

  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return { age: years, age_format: 'Years', years, months, days };
  } else if (months > 0) {
    return { age: months, age_format: 'Months', years, months, days };
  } else {
    return { age: Math.max(0, days), age_format: 'Days', years, months, days };
  }
}

/**
 * Estimates DOB string (YYYY-MM-DD) from age and age_format ('Years', 'Months', 'Days').
 */
export function calculateDobFromAge(age, ageFormat = 'Years') {
  if (age === '' || age == null || isNaN(age)) return '';
  
  const num = parseFloat(age);
  if (num < 0) return '';

  const today = new Date();
  const dob = new Date(today);

  if (ageFormat === 'Days') {
    dob.setDate(today.getDate() - Math.round(num));
  } else if (ageFormat === 'Months') {
    const wholeMonths = Math.floor(num);
    const fraction = num - wholeMonths;
    dob.setMonth(today.getMonth() - wholeMonths);
    if (fraction > 0) {
      dob.setDate(dob.getDate() - Math.round(fraction * 30));
    }
  } else {
    // Default 'Years'
    const wholeYears = Math.floor(num);
    const fraction = num - wholeYears;
    dob.setFullYear(today.getFullYear() - wholeYears);
    if (fraction > 0) {
      dob.setDate(dob.getDate() - Math.round(fraction * 365));
    }
  }

  const y = dob.getFullYear();
  const m = String(dob.getMonth() + 1).padStart(2, '0');
  const d = String(dob.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates BMI from weight in kg and height in cm.
 * Formula: weight_kg / (height_m ^ 2)
 */
export function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) {
    return { bmi: '', category: '—', color: '#64748b' };
  }
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (isNaN(w) || isNaN(h) || h <= 0 || w <= 0) {
    return { bmi: '', category: '—', color: '#64748b' };
  }

  const heightM = h / 100.0;
  const bmiVal = (w / (heightM * heightM)).toFixed(1);
  const numeric = parseFloat(bmiVal);

  let category = 'Normal';
  let color = '#059669'; // Green
  let badgeClass = 'bmi-normal';

  if (numeric < 18.5) {
    category = 'Underweight';
    color = '#2563eb'; // Blue
    badgeClass = 'bmi-under';
  } else if (numeric >= 18.5 && numeric <= 24.9) {
    category = 'Normal';
    color = '#059669'; // Green
    badgeClass = 'bmi-normal';
  } else if (numeric >= 25.0 && numeric <= 29.9) {
    category = 'Overweight';
    color = '#d97706'; // Amber
    badgeClass = 'bmi-over';
  } else if (numeric >= 30.0) {
    category = 'Obese';
    color = '#dc2626'; // Red
    badgeClass = 'bmi-obese';
  }

  return { bmi: bmiVal, category, color, badgeClass };
}

/**
 * Validates the full patient registration & vitals payload.
 */
export function validateRegistrationPayload(data) {
  const errors = {};

  // Full Name
  const name = (data.full_name || data.name || '').trim();
  if (!name) {
    errors.full_name = 'Full Name is required.';
  } else if (name.length < 2) {
    errors.full_name = 'Name must be at least 2 characters.';
  }

  // Contact Phone Number: strict 10 digits
  const phone = String(data.phone_number || data.phone || '').replace(/\D/g, '');
  if (!phone) {
    errors.phone_number = '10-digit Phone number is required.';
  } else if (phone.length !== 10) {
    errors.phone_number = `Phone number must be exactly 10 digits (currently ${phone.length}).`;
  }

  // Age / DOB
  if (!data.dob && (data.age === '' || data.age == null)) {
    errors.age = 'Either Date of Birth or Age is required.';
  } else if (data.age !== '' && data.age != null) {
    const a = parseFloat(data.age);
    if (isNaN(a) || a < 0 || a > 150) {
      errors.age = 'Age must be between 0 and 150.';
    }
  }

  // Vitals limits (optional fields, but if provided must be within clinical bounds)
  if (data.weight_kg !== '' && data.weight_kg != null) {
    const w = parseFloat(data.weight_kg);
    if (isNaN(w) || w <= 0 || w > 200) {
      errors.weight_kg = 'Weight must be between 1 and 200 kg.';
    }
  }

  if (data.height_cm !== '' && data.height_cm != null) {
    const h = parseFloat(data.height_cm);
    if (isNaN(h) || h <= 0 || h > 250) {
      errors.height_cm = 'Height must be between 1 and 250 cm.';
    }
  }

  if (data.spo2_percent !== '' && data.spo2_percent != null) {
    const s = parseInt(data.spo2_percent, 10);
    if (isNaN(s) || s < 0 || s > 100) {
      errors.spo2_percent = 'SpO2 must be between 0 and 100%.';
    }
  }

  if (data.blood_pressure && typeof data.blood_pressure === 'string' && data.blood_pressure.trim()) {
    const bpTrim = data.blood_pressure.trim();
    if (bpTrim && !/^\d{2,3}\/\d{2,3}$/.test(bpTrim)) {
      errors.blood_pressure = 'BP format must be Systolic/Diastolic (e.g. 120/80).';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function usePatientCalculations(demographics, vitals) {
  const bmiInfo = useMemo(() => {
    return calculateBmi(vitals?.weight_kg, vitals?.height_cm);
  }, [vitals?.weight_kg, vitals?.height_cm]);

  return {
    bmiInfo,
    calculateAgeFromDob,
    calculateDobFromAge,
    calculateBmi,
    validateRegistrationPayload,
  };
}
