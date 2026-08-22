import React, { useState } from 'react';
import { calculateAgeFromDob, calculateDobFromAge } from '../../hooks/usePatientCalculations';
import {
  PatientUserIcon,
  PhoneIcon,
  IdBadgeIcon,
  PlusIcon,
  CheckCircleIcon,
} from '../common/MedicalIcons';
import BarcodeDisplay from './BarcodeDisplay';

export default function DemographicsCard({
  demographics,
  onChange,
  errors = {},
  isEditMode = false,
  onResetToNew = () => {},
}) {
  const [activeInputSource, setActiveInputSource] = useState('dob'); // 'dob' or 'age'

  // Handle DOB Change -> Auto compute Age
  const handleDobChange = (e) => {
    const newDob = e.target.value;
    setActiveInputSource('dob');
    if (!newDob) {
      onChange({ dob: '', age: '', age_format: demographics.age_format || 'Years' });
      return;
    }
    const { age, age_format } = calculateAgeFromDob(newDob);
    onChange({
      dob: newDob,
      age: age !== '' ? String(age) : '',
      age_format: age_format || 'Years',
    });
  };

  // Handle Age Value Change -> Auto compute estimated DOB
  const handleAgeChange = (e) => {
    const newAge = e.target.value;
    setActiveInputSource('age');
    if (newAge === '') {
      onChange({ age: '', dob: '' });
      return;
    }
    const estimatedDob = calculateDobFromAge(newAge, demographics.age_format || 'Years');
    onChange({
      age: newAge,
      dob: estimatedDob,
    });
  };

  // Handle Age Format Change ('Years', 'Months', 'Days')
  const handleAgeFormatChange = (e) => {
    const newFormat = e.target.value;
    const estimatedDob = demographics.age
      ? calculateDobFromAge(demographics.age, newFormat)
      : demographics.dob;
    onChange({
      age_format: newFormat,
      dob: estimatedDob,
    });
  };

  // Generic field change
  const handleFieldChange = (field, value) => {
    onChange({ [field]: value });
  };

  // Phone number cleaning to 10 digits
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/\D/g, '').slice(0, 10);
    onChange({ phone_number: cleaned, phone: cleaned });
  };

  const phoneLength = (demographics.phone_number || demographics.phone || '').length;

  return (
    <section className="form-card demographics-card">
      <div className="card-header-banner">
        <div className="banner-left">
          <span className="banner-icon-badge">
            <PatientUserIcon className="banner-svg-icon" />
          </span>
          <div>
            <h2 className="banner-title">
              {isEditMode ? 'Edit Patient Demographics' : 'Patient Demographics'}
            </h2>
            <p className="banner-subtitle">Identity, age, guardian relation, and contact verification</p>
          </div>
        </div>

        <div className="banner-right">
          {/* Visual Barcode Display */}
          <BarcodeDisplay
            value={demographics.patient_id || demographics.barcode}
            isAuto={!demographics.patient_id}
          />

          {isEditMode && (
            <button
              type="button"
              className="btn-switch-new"
              onClick={onResetToNew}
              title="Switch to New Patient Registration"
            >
              <PlusIcon className="btn-icon-svg" />
              <span>New Patient</span>
            </button>
          )}
        </div>
      </div>

      <div className="card-body-grid grid-3-col">
        {/* Full Name (Required) */}
        <div className={`field-group col-span-2 ${errors.full_name ? 'has-error' : ''}`}>
          <label htmlFor="reg_full_name" className="field-label">
            Full Name <span className="req-asterisk">*</span>
          </label>
          <div className="input-with-icon">
            <span className="input-prefix-icon">
              <IdBadgeIcon className="input-icon-svg" />
            </span>
            <input
              id="reg_full_name"
              name="full_name"
              type="text"
              className="form-input"
              placeholder="e.g., Rajesh Kumar"
              value={demographics.full_name || demographics.name || ''}
              onChange={(e) => {
                handleFieldChange('full_name', e.target.value);
                handleFieldChange('name', e.target.value);
              }}
              required
            />
          </div>
          {errors.full_name && <span className="field-error-text">{errors.full_name}</span>}
        </div>

        {/* Gender */}
        <div className="field-group">
          <label htmlFor="reg_gender" className="field-label">
            Gender <span className="req-asterisk">*</span>
          </label>
          <select
            id="reg_gender"
            name="gender"
            className="form-select"
            value={demographics.gender || 'Male'}
            onChange={(e) => handleFieldChange('gender', e.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Others">Others</option>
          </select>
        </div>

        {/* Date of Birth */}
        <div className={`field-group ${errors.dob ? 'has-error' : ''}`}>
          <label htmlFor="reg_dob" className="field-label">
            Date of Birth
          </label>
          <input
            id="reg_dob"
            name="dob"
            type="date"
            className="form-input"
            max={new Date().toISOString().split('T')[0]}
            value={demographics.dob || ''}
            onChange={handleDobChange}
          />
          {demographics.dob && (
            <span className="field-helper-info">
              {activeInputSource === 'dob' ? 'Auto-calculated from DOB' : 'Estimated from age'}
            </span>
          )}
        </div>

        {/* Age & Format */}
        <div className={`field-group ${errors.age ? 'has-error' : ''}`}>
          <label htmlFor="reg_age" className="field-label">
            Age <span className="req-asterisk">*</span>
          </label>
          <div className="compound-input-row">
            <input
              id="reg_age"
              name="age"
              type="number"
              min="0"
              max="150"
              step="any"
              className="form-input age-val-input"
              placeholder="35"
              value={demographics.age ?? ''}
              onChange={handleAgeChange}
              required
            />
            <select
              id="reg_age_format"
              name="age_format"
              className="form-select age-format-select"
              value={demographics.age_format || 'Years'}
              onChange={handleAgeFormatChange}
            >
              <option value="Years">Years</option>
              <option value="Months">Months</option>
              <option value="Days">Days</option>
            </select>
          </div>
          {errors.age && <span className="field-error-text">{errors.age}</span>}
        </div>

        {/* Guardian Relation */}
        <div className="field-group">
          <label htmlFor="reg_guardian_relation" className="field-label">
            Guardian Relation
          </label>
          <select
            id="reg_guardian_relation"
            name="guardian_relation"
            className="form-select"
            value={demographics.guardian_relation || ''}
            onChange={(e) => handleFieldChange('guardian_relation', e.target.value)}
          >
            <option value="">-- Relation --</option>
            <option value="S/o">S/o (Son of)</option>
            <option value="D/o">D/o (Daughter of)</option>
            <option value="W/o">W/o (Wife of)</option>
            <option value="B/o">B/o (Brother of)</option>
            <option value="C/o">C/o (Care of)</option>
          </select>
        </div>

        {/* Guardian Name */}
        <div className="field-group col-span-2">
          <label htmlFor="reg_guardian_name" className="field-label">
            Guardian Name
          </label>
          <input
            id="reg_guardian_name"
            name="guardian_name"
            type="text"
            className="form-input"
            placeholder="e.g., Ramesh Kumar"
            value={demographics.guardian_name || ''}
            onChange={(e) => handleFieldChange('guardian_name', e.target.value)}
          />
        </div>

        {/* Contact Phone (Strict 10-digit validation) */}
        <div className={`field-group col-span-1 ${errors.phone_number ? 'has-error' : ''}`}>
          <div className="field-label-split">
            <label htmlFor="reg_phone" className="field-label">
              Phone Number <span className="req-asterisk">*</span>
            </label>
            <span className={`phone-count-indicator ${phoneLength === 10 ? 'valid' : 'invalid'}`}>
              {phoneLength === 10 ? <CheckCircleIcon className="w-3 h-3 inline mr-1" /> : null}
              {phoneLength}/10 digits
            </span>
          </div>
          <div className="input-with-icon">
            <span className="input-prefix-icon">
              <PhoneIcon className="input-icon-svg" />
            </span>
            <input
              id="reg_phone"
              name="phone_number"
              type="tel"
              className="form-input font-mono"
              placeholder="10-digit mobile"
              value={demographics.phone_number || demographics.phone || ''}
              onChange={handlePhoneChange}
              maxLength={10}
              required
            />
          </div>
          {errors.phone_number && (
            <span className="field-error-text">{errors.phone_number}</span>
          )}
        </div>

        {/* Address */}
        <div className="field-group col-span-3">
          <label htmlFor="reg_address" className="field-label">
            Residential Address
          </label>
          <input
            id="reg_address"
            name="address"
            type="text"
            className="form-input"
            placeholder="Door No, Street, Village / Town, District"
            value={demographics.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
