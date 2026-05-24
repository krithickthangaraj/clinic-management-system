import { useEffect, useMemo, useState } from 'react';
import './AgeDobInput.css';

const pad = (value) => String(value).padStart(2, '0');

const formatDateValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIntOrZero = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDecimalInfantDays = (value) => {
  const text = String(value || '').trim();
  if (!/^0\.\d+$/.test(text)) return null;
  return parseInt(text.split('.')[1], 10) || 0;
};

const normalizeAge = (ageYears, ageMonths, ageDays) => {
  const decimalDays = getDecimalInfantDays(ageYears);

  if (decimalDays != null) {
    return {
      years: 0,
      months: 0,
      days: decimalDays,
      isDecimalInfant: true,
    };
  }

  return {
    years: parseIntOrZero(ageYears),
    months: parseIntOrZero(ageMonths),
    days: parseIntOrZero(ageDays),
    isDecimalInfant: false,
  };
};

const calculateDobFromAge = (ageYears, ageMonths, ageDays) => {
  const normalized = normalizeAge(ageYears, ageMonths, ageDays);
  const today = new Date();

  if (normalized.years === 0 && normalized.months === 0 && normalized.days > 0) {
    const dob = new Date(today);
    dob.setDate(dob.getDate() - normalized.days);
    return formatDateValue(dob);
  }

  if (normalized.years === 0 && normalized.months === 0) {
    return '';
  }

  if (normalized.months === 0 && normalized.days === 0) {
    return `${today.getFullYear() - normalized.years}-01-01`;
  }

  const dob = new Date(today);
  dob.setFullYear(dob.getFullYear() - normalized.years);
  dob.setMonth(dob.getMonth() - normalized.months);
  dob.setDate(dob.getDate() - normalized.days);
  return formatDateValue(dob);
};

const calculateAgeFromDob = (dobStr) => {
  if (!dobStr) return { years: 0, months: 0, days: 0 };

  const dob = new Date(`${dobStr}T00:00:00`);
  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(years, 0),
    months: Math.max(months, 0),
    days: Math.max(days, 0),
  };
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatAgeDisplay = ({ years, months, days }) => {
  const parts = [];
  if (years > 0) parts.push(`${years} y`);
  if (months > 0) parts.push(`${months} m`);
  if (days > 0 || parts.length === 0) parts.push(`${days} d`);
  return parts.join(' ');
};

export default function AgeDobInput({
  mode = 'age',
  ageYears = '',
  ageMonths = '0',
  ageDays = '',
  dob = '',
  onModeChange = () => {},
  onAgeChange = () => {},
  onDobChange = () => {},
}) {
  const [inputMode, setInputMode] = useState(mode);
  const [years, setYears] = useState(ageYears);
  const [months, setMonths] = useState(ageMonths);
  const [days, setDays] = useState(ageDays);
  const [dobInput, setDobInput] = useState(dob);

  const normalizedAge = useMemo(
    () => normalizeAge(years, months, days),
    [years, months, days]
  );
  const showDaysField =
    inputMode === 'age' &&
    (normalizedAge.isDecimalInfant ||
      (parseIntOrZero(years) === 0 && parseIntOrZero(months) === 0));
  const calculatedDob =
    inputMode === 'age' ? calculateDobFromAge(years, months, days) : '';
  const calculatedAge =
    inputMode === 'dob' ? calculateAgeFromDob(dobInput) : null;

  useEffect(() => {
    setInputMode(mode);
  }, [mode]);

  useEffect(() => {
    setYears(ageYears);
  }, [ageYears]);

  useEffect(() => {
    setMonths(ageMonths || '0');
  }, [ageMonths]);

  useEffect(() => {
    setDays(ageDays || '');
  }, [ageDays]);

  useEffect(() => {
    setDobInput(dob || '');
  }, [dob]);

  useEffect(() => {
    if (inputMode === 'age' && calculatedDob) {
      onDobChange(calculatedDob);
    }
  }, [calculatedDob, inputMode]);

  useEffect(() => {
    if (inputMode === 'dob' && dobInput && calculatedAge) {
      onAgeChange(
        String(calculatedAge.years),
        String(calculatedAge.months),
        String(calculatedAge.days)
      );
    }
  }, [dobInput, inputMode, calculatedAge?.years, calculatedAge?.months, calculatedAge?.days]);

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setInputMode(newMode);
    onModeChange(newMode);
  };

  const handleYearsChange = (e) => {
    const nextYears = e.target.value;
    const decimalDays = getDecimalInfantDays(nextYears);

    setYears(nextYears);
    if (decimalDays != null) {
      setMonths('0');
      setDays(String(decimalDays));
      onAgeChange(nextYears, '0', String(decimalDays));
      return;
    }

    onAgeChange(nextYears, months, days);
  };

  const handleMonthsChange = (e) => {
    const nextMonths = e.target.value;
    setMonths(nextMonths);
    onAgeChange(years, nextMonths, days);
  };

  const handleDaysChange = (e) => {
    const nextDays = e.target.value;
    setDays(nextDays);
    onAgeChange(years, months, nextDays);
  };

  const handleDobChange = (e) => {
    const nextDob = e.target.value;
    setDobInput(nextDob);
    onDobChange(nextDob);
  };

  return (
    <div className="age-dob-input">
      <div className="age-dob-mode-row">
        <label htmlFor="age_dob_mode">Type</label>
        <select
          id="age_dob_mode"
          value={inputMode}
          onChange={handleModeChange}
          className="age-dob-mode-select"
        >
          <option value="age">Enter Age</option>
          <option value="dob">Enter DOB</option>
        </select>
      </div>

      {inputMode === 'age' && (
        <div className="age-dob-content">
          <div className="age-dob-grid">
            <div className="field">
              <label htmlFor="age_years">Years *</label>
              <input
                id="age_years"
                name="age_years"
                type="number"
                min="0"
                max="150"
                step="0.01"
                value={years}
                onChange={handleYearsChange}
                placeholder="0"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="age_months">Months</label>
              <input
                id="age_months"
                name="age_months"
                type="number"
                min="0"
                max="11"
                value={months}
                onChange={handleMonthsChange}
                placeholder="0"
              />
            </div>
            {showDaysField && (
              <div className="field">
                <label htmlFor="age_days">Days</label>
                <input
                  id="age_days"
                  name="age_days"
                  type="number"
                  min="0"
                  max="30"
                  value={normalizedAge.isDecimalInfant ? normalizedAge.days : days}
                  onChange={handleDaysChange}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          <div className="age-dob-calculated">
            <span>Calculated DOB</span>
            <strong>{calculatedDob ? formatDateDisplay(calculatedDob) : '-'}</strong>
          </div>
        </div>
      )}

      {inputMode === 'dob' && (
        <div className="age-dob-content">
          <div className="field">
            <label htmlFor="dob_input">Date of Birth *</label>
            <input
              id="dob_input"
              type="date"
              value={dobInput}
              onChange={handleDobChange}
              required
            />
          </div>

          <div className="age-dob-calculated">
            <span>Calculated Age</span>
            <strong>
              {dobInput && calculatedAge ? formatAgeDisplay(calculatedAge) : '-'}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
