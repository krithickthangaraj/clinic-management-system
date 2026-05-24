import { useEffect, useState } from 'react';
import './AgeDobInput.css';

/**
 * AgeDobInput Component
 * Allows user to choose between entering Age or DOB
 * Auto-calculates the counterpart (Age → DOB or DOB → Age)
 * Special handling for infants (decimal years like 0.20 = 20 days)
 */

export default function AgeDobInput({
  mode = 'age', // 'age' or 'dob'
  ageYears = '',
  ageMonths = '0',
  dob = '', // YYYY-MM-DD format
  onModeChange = () => {},
  onAgeChange = () => {},
  onDobChange = () => {},
}) {
  const [inputMode, setInputMode] = useState(mode);
  const [years, setYears] = useState(ageYears);
  const [months, setMonths] = useState(ageMonths);
  const [dobInput, setDobInput] = useState(dob);
  const [calculatedDob, setCalculatedDob] = useState('');
  const [calculatedAge, setCalculatedAge] = useState({
    years: 0,
    months: 0,
    days: 0,
  });

  // Calculate DOB from age
  useEffect(() => {
    if (inputMode === 'age' && (years || months)) {
      calculateDobFromAge(years, months);
    }
  }, [years, months, inputMode]);

  // Calculate age from DOB
  useEffect(() => {
    if (inputMode === 'dob' && dobInput) {
      calculateAgeFromDob(dobInput);
    }
  }, [dobInput, inputMode]);

  const calculateDobFromAge = (ageYears, ageMonths) => {
    if (!ageYears && !ageMonths) return;

    const today = new Date();
    let yearsNum = parseFloat(ageYears) || 0;
    let monthsNum = parseInt(ageMonths) || 0;

    // Handle decimal years (e.g., 0.20 = 20 days old)
    if (yearsNum > 0 && yearsNum < 1) {
      const days = Math.round(yearsNum * 365);
      const dob = new Date(today);
      dob.setDate(dob.getDate() - days);
      const dobStr = dob.toISOString().split('T')[0];
      setCalculatedDob(dobStr);
      onDobChange(dobStr);
      return;
    }

    // Standard age calculation
    const dob = new Date(today);
    dob.setFullYear(dob.getFullYear() - Math.floor(yearsNum));
    dob.setMonth(dob.getMonth() - monthsNum);

    const dobStr = dob.toISOString().split('T')[0];
    setCalculatedDob(dobStr);
    onDobChange(dobStr);
  };

  const calculateAgeFromDob = (dobStr) => {
    if (!dobStr) return;

    const dob = new Date(dobStr + 'T00:00:00');
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

    setCalculatedAge({ years, months, days });
  };

  const handleModeChange = (newMode) => {
    setInputMode(newMode);
    onModeChange(newMode);
  };

  const handleYearsChange = (e) => {
    setYears(e.target.value);
    onAgeChange(e.target.value, months);
  };

  const handleMonthsChange = (e) => {
    setMonths(e.target.value);
    onAgeChange(years, e.target.value);
  };

  const handleDobChange = (e) => {
    setDobInput(e.target.value);
    onDobChange(e.target.value);
  };

  return (
    <div className="age-dob-input">
      {/* Mode Selection */}
      <div className="mode-selector">
        <button
          type="button"
          className={`mode-btn ${inputMode === 'age' ? 'active' : ''}`}
          onClick={() => handleModeChange('age')}
        >
          Enter Age
        </button>
        <button
          type="button"
          className={`mode-btn ${inputMode === 'dob' ? 'active' : ''}`}
          onClick={() => handleModeChange('dob')}
        >
          Enter DOB
        </button>
      </div>

      {/* Age Input Mode */}
      {inputMode === 'age' && (
        <div className="mode-content age-mode">
          <div className="age-inputs">
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
                placeholder="Age in years (e.g., 25 or 0.20 for infants)"
                required
              />
              <small>For infants: enter decimal (0.20 = 20 days old)</small>
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
          </div>

          {/* Calculated DOB Display */}
          {calculatedDob && (
            <div className="calculated-field">
              <label>Calculated DOB</label>
              <div className="calculated-value">
                {calculateDateDisplay(calculatedDob)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOB Input Mode */}
      {inputMode === 'dob' && (
        <div className="mode-content dob-mode">
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

          {/* Calculated Age Display */}
          {dobInput && (
            <div className="calculated-field">
              <label>Calculated Age</label>
              <div className="calculated-value">
                {calculatedAge.years > 0 && `${calculatedAge.years} y`}
                {calculatedAge.months > 0 && ` ${calculatedAge.months} m`}
                {calculatedAge.days > 0 && ` ${calculatedAge.days} d`}
                {calculatedAge.years === 0 &&
                  calculatedAge.months === 0 &&
                  `${calculatedAge.days} days`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper: Format date for display
function calculateDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
