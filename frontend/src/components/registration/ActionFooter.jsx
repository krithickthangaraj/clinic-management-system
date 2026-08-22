import React from 'react';
import {
  PrescriptionIcon,
  LabIcon,
  SaveIcon,
  PlusIcon,
} from '../common/MedicalIcons';

export default function ActionFooter({
  onSave,
  onMakePrescription,
  onMakeInvestigation,
  isSaving = false,
  hasActiveVisit = false,
  isEditMode = false,
}) {
  return (
    <footer className="registration-action-footer">
      <div className="footer-container">
        <div className="footer-left">
          <span className="footer-hint">
            Keyboard shortcut: Press <kbd className="shortcut-kbd">Ctrl</kbd> + <kbd className="shortcut-kbd">Enter</kbd> to save &amp; register.
          </span>
        </div>

        <div className="footer-actions">
          {/* Button 1: Make Prescription (Secondary Outline) */}
          <button
            type="button"
            className="btn-secondary-outline"
            onClick={onMakePrescription}
            disabled={isSaving}
            title={hasActiveVisit ? 'Open prescription editor for current visit' : 'Save and proceed to prescription'}
          >
            <PrescriptionIcon className="btn-icon-svg" />
            <span>Make Prescription</span>
          </button>

          {/* Button 2: Make Investigation Report (Secondary Outline) */}
          <button
            type="button"
            className="btn-secondary-outline"
            onClick={onMakeInvestigation}
            disabled={isSaving}
            title={hasActiveVisit ? 'Open lab tests for current visit' : 'Save and proceed to lab investigation'}
          >
            <LabIcon className="btn-icon-svg" />
            <span>Make Investigation Report</span>
          </button>

          {/* Button 3: Save & Add New Patient (Primary Solid Color) */}
          <button
            type="button"
            className="btn-primary-solid"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner-loader" aria-hidden="true" />
                <span>Saving Record…</span>
              </>
            ) : isEditMode ? (
              <>
                <SaveIcon className="btn-icon-svg" />
                <span>Update Patient &amp; Vitals</span>
              </>
            ) : (
              <>
                <PlusIcon className="btn-icon-svg" />
                <span>Save &amp; Add New Patient</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
