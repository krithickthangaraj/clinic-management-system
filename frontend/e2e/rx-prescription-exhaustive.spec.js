import { expect, test } from '@playwright/test';

test.describe('RX Prescription Consultation Desk - Exhaustive 20-Point Test Suite', () => {
  const mockVisitId = '101';
  const mockVisitData = {
    id: 101,
    visit_number: 'V-20260822-101',
    patient_id: 201,
    consultant_assigned: 'Dr. T.S.Jeyagowthaman',
    status: 'in_consultation',
    created_at: new Date().toISOString(),
    patient: {
      id: 201,
      patient_id: 'PAT-20001',
      name: 'Ramesh Kumar',
      age: 45,
      age_years: 45,
      gender: 'Male',
      phone: '9840123456',
    },
  };

  const mockVitalsData = {
    id: 301,
    visit_id: 101,
    weight_kg: 78.0,
    height_cm: 172.0,
    bmi: 26.4,
    bp_systolic: 145, // Abnormal (>=140) -> should trigger red badge
    bp_diastolic: 95,
    blood_pressure: '145/95',
    temperature_f: 100.2, // Abnormal (>=99.5) -> should trigger red badge
    pulse_rate_bpm: 84,
    spo2_percent: 98,
    grbs_mg_dl: 140,
  };

  test.beforeEach(async ({ page }) => {
    // 1. Mock Authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          username: 'doctor',
          full_name: 'Dr. T.S.Jeyagowthaman',
          role: 'doctor',
        })
      );
    });

    // 2. Setup API route intercepts
    await page.route(`**/api/v1/visits/${mockVisitId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVisitData),
      });
    });

    await page.route(`**/api/v1/vitals/visit/${mockVisitId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVitalsData),
      });
    });

    await page.route(`**/api/v1/prescriptions/full/${mockVisitId}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No existing prescription' }),
      });
    });

    await page.route('**/api/v1/master/meds/drugs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Paracetamol 650mg', brand_name: 'Dolo 650', generic_name: 'Paracetamol', dosage: '1 Tab', frequency: 'TDS (1-1-1)', instructions: 'After food' },
          { id: 2, name: 'Amoxicillin 500mg', brand_name: 'Augmentin 625', generic_name: 'Amoxicillin + Clav', dosage: '1 Tab', frequency: 'BD (1-0-1)', instructions: 'After food' },
          { id: 3, name: 'Pantoprazole 40mg', brand_name: 'Pan 40', generic_name: 'Pantoprazole', dosage: '1 Tab', frequency: 'OD (1-0-0)', instructions: 'Empty stomach' },
        ]),
      });
    });

    await page.route('**/api/v1/medicines*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Paracetamol 650mg', brand_name: 'Dolo 650', generic_name: 'Paracetamol' },
          { id: 2, name: 'Amoxicillin 500mg', brand_name: 'Augmentin 625', generic_name: 'Amoxicillin + Clav' },
        ]),
      });
    });
  });

  // =========================================================================
  // GROUP A: UI & Layout Rendering (Test Cases 1 - 4)
  // =========================================================================
  test.describe('Group A: UI & Layout Rendering', () => {
    test('1. Asserts the Sticky Vitals Header renders and remains visible when scrolling', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const header = page.locator('[data-testid="sticky-vitals-header"]');
      await expect(header).toBeVisible();
      await expect(page.locator('[data-testid="patient-name-header"]')).toContainText('Ramesh Kumar');

      // Scroll down 500px and assert header remains visible (sticky)
      await page.evaluate(() => window.scrollBy(0, 500));
      await expect(header).toBeVisible();
    });

    test('2. Asserts the 3-column layout renders correctly on desktop viewports', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      const gridContainer = page.locator('[data-testid="consultation-3-column-grid"]');
      await expect(gridContainer).toBeVisible();
      await expect(page.locator('[data-testid="medical-history-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="rx-medication-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="clinical-plan-sidebar"]')).toBeVisible();
    });

    test('3. Asserts the Sticky Footer renders at the bottom with all 6 action buttons aligned', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const footer = page.locator('[data-testid="prescription-sticky-footer"]');
      await expect(footer).toBeVisible();

      // Assert all 6 action buttons
      await expect(page.locator('[data-testid="btn-action-not-visited"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-action-followup"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-action-reminder"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-action-pending"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-save-prescription"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-print-prescription"]')).toBeVisible();
    });

    test('4. Asserts Abnormal Vitals (e.g., High BP >= 140/90) render with the correct red warning badge CSS', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const bpBadge = page.locator('[data-testid="bp-vital-badge"]');
      await expect(bpBadge).toBeVisible();
      await expect(bpBadge).toContainText('145/95');

      // Assert red danger styling
      const classAttr = await bpBadge.getAttribute('class');
      expect(classAttr).toContain('bg-rose-50');
      expect(classAttr).toContain('text-rose-700');
    });
  });

  // =========================================================================
  // GROUP B: History & Clinical Plan Sidebars (Test Cases 5 - 8)
  // =========================================================================
  test.describe('Group B: History & Clinical Plan (Sidebars)', () => {
    test('5. Asserts the History Accordions toggle open and closed correctly', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const toggleBtn = page.locator('[data-testid="btn-toggle-history"]');

      // Check current accordion body state
      const body = page.locator('[data-testid="history-body"]');
      const isInitiallyOpen = await body.isVisible();

      // Toggle state
      await toggleBtn.click();
      if (isInitiallyOpen) {
        await expect(body).not.toBeVisible();
        await toggleBtn.click();
        await expect(body).toBeVisible();
      } else {
        await expect(body).toBeVisible();
      }
    });

    test('6. Asserts typing in the "Complaints" textarea/input handles data entry gracefully', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const complaintInput = page.locator('[data-testid="input-complaint"]');
      await complaintInput.fill('Severe dry cough and sore throat for 4 days');
      await page.click('[data-testid="btn-add-complaint"]');

      const tagsCloud = page.locator('[data-testid="complaints-tags-cloud"]');
      await expect(tagsCloud).toContainText('Severe dry cough and sore throat for 4 days');
    });

    test('7. Asserts the "Lab Reports" and "Referral" fields accept and retain data', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const labInput = page.locator('[data-testid="input-lab-reports"]');
      const refInput = page.locator('[data-testid="input-referral"]');

      await labInput.fill('Hb: 13.5, WBC: 7400, Platelets: 2.8L, Normal Renal Profile');
      await refInput.fill('Cardiologist (Dr. Meenakshi Sundaram)');

      await expect(labInput).toHaveValue('Hb: 13.5, WBC: 7400, Platelets: 2.8L, Normal Renal Profile');
      await expect(refInput).toHaveValue('Cardiologist (Dr. Meenakshi Sundaram)');
    });

    test('8. Asserts the "Follow up After" date picker opens and selects a valid future date', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const dateInput = page.locator('[data-testid="input-followup-date"]');
      await dateInput.fill('2026-09-01');
      await expect(dateInput).toHaveValue('2026-09-01');

      // Checkbox for followup should be automatically checked
      const followupCheck = page.locator('[data-testid="checkbox-followup"]');
      await expect(followupCheck).toBeChecked();
    });
  });

  // =========================================================================
  // GROUP C: The RX Medication Table (Core Engine) (Test Cases 9 - 16)
  // =========================================================================
  test.describe('Group C: The RX Medication Table (Core Engine)', () => {
    test('9. Asserts clicking "Add Medicine" appends a new, empty row to the bottom of the table', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      await expect(page.locator('[data-testid="rx-row-0"]')).toBeVisible();

      await page.click('[data-testid="btn-add-drug"]');
      await expect(page.locator('[data-testid="rx-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="drugs-count-label"]')).toContainText('2 medications');
    });

    test('10. Asserts clicking the "Trash/Delete" icon removes the correct specific row', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      // Setup row 0 and row 1
      await page.fill('[data-testid="input-brand-0"]', 'Dolo 650');
      await page.click('[data-testid="btn-add-drug"]');
      await page.fill('[data-testid="input-brand-1"]', 'Pan 40');

      // Delete Row 0 (Dolo 650)
      await page.click('[data-testid="btn-remove-0"]');

      // Remaining Row 0 should now be Pan 40
      await expect(page.locator('[data-testid="input-brand-0"]')).toHaveValue('Pan 40');
    });

    test('11. Asserts the "Quantity" auto-calculates correctly (1 Tab x 3 Freq x 5 Days = 15)', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      await page.fill('[data-testid="input-dosage-0"]', '1 Tab');
      await page.selectOption('[data-testid="select-freq-0"]', 'TDS (1-1-1)');
      await page.fill('[data-testid="input-days-0"]', '5');

      await expect(page.locator('[data-testid="input-quantity-0"]')).toHaveValue('15');
    });

    test('12. Asserts the manual override of "Quantity" works and stops auto-calculating for that row', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      await page.fill('[data-testid="input-days-0"]', '5');
      await expect(page.locator('[data-testid="input-quantity-0"]')).toHaveValue('15');

      // Manually set quantity to 50
      await page.fill('[data-testid="input-quantity-0"]', '50');
      await expect(page.locator('[data-testid="input-quantity-0"]')).toHaveValue('50');

      // Change days to 10 -> manual override remains 50
      await page.fill('[data-testid="input-days-0"]', '10');
      await expect(page.locator('[data-testid="input-quantity-0"]')).toHaveValue('50');
    });

    test('13. Asserts the "Smart Autocomplete/Quick Add" dropdown appears when typing a drug name', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);
      const drugInput = page.locator('[data-testid="input-drug-0"]');
      await drugInput.fill('Para');

      const dropdown = page.locator('[data-testid="autocomplete-dropdown-0"]');
      await expect(dropdown).toBeVisible();
      await expect(dropdown).toContainText('Paracetamol 650mg');

      // Click suggestion
      await page.click('[data-testid="autocomplete-item-1"]');
      await expect(drugInput).toHaveValue('Paracetamol 650mg');
    });

    test('14. Asserts Up/Down arrows successfully reorder row 1 and row 2', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      await page.fill('[data-testid="input-brand-0"]', 'Drug A');
      await page.click('[data-testid="btn-add-drug"]');
      await page.fill('[data-testid="input-brand-1"]', 'Drug B');

      // Move Drug B (Row 1) Up to Row 0
      await page.click('[data-testid="btn-move-up-1"]');

      await expect(page.locator('[data-testid="input-brand-0"]')).toHaveValue('Drug B');
      await expect(page.locator('[data-testid="input-brand-1"]')).toHaveValue('Drug A');
    });

    test('15. Asserts clicking "Duplicate Row" creates an exact copy of the selected medicine', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      await page.fill('[data-testid="input-brand-0"]', 'Augmentin 625');
      await page.fill('[data-testid="input-drug-0"]', 'Amoxicillin + Clavulanic Acid');
      await page.fill('[data-testid="input-dosage-0"]', '1 Tab');
      await page.selectOption('[data-testid="select-freq-0"]', 'BD (1-0-1)');

      await page.click('[data-testid="btn-duplicate-0"]');

      await expect(page.locator('[data-testid="rx-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-brand-1"]')).toHaveValue('Augmentin 625');
      await expect(page.locator('[data-testid="input-drug-1"]')).toHaveValue('Amoxicillin + Clavulanic Acid');
    });

    test('16. Asserts loading a "Prescription Template" instantly populates the table with multiple rows', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      const templateSelect = page.locator('[data-testid="select-prescription-template"]');
      await templateSelect.selectOption('fever_viral');

      // Assert populated rows for Fever & Viral Protocol
      await expect(page.locator('[data-testid="rx-row-0"]')).toBeVisible();
      await expect(page.locator('[data-testid="rx-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="rx-row-2"]')).toBeVisible();

      await expect(page.locator('[data-testid="input-brand-0"]')).toHaveValue('Dolo 650');
      await expect(page.locator('[data-testid="input-brand-1"]')).toHaveValue('Cetcip');
      await expect(page.locator('[data-testid="input-brand-2"]')).toHaveValue('Pan 40');
    });
  });

  // =========================================================================
  // GROUP D: Submission, Keyboard Shortcuts & Edge Cases (Test Cases 17 - 20)
  // =========================================================================
  test.describe('Group D: Submission, Keyboard Shortcuts & Edge Cases', () => {
    test('17. Asserts pressing Ctrl+Enter (or Cmd+Enter) triggers the Save function', async ({ page }) => {
      let saved = false;
      await page.route('**/api/v1/prescriptions/full', async (route) => {
        saved = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'completed' }),
        });
      });

      await page.goto(`/doctor/consultation/${mockVisitId}`);
      await page.fill('[data-testid="input-drug-0"]', 'Paracetamol 650mg');

      // Press Ctrl+Enter
      await page.keyboard.press('Control+Enter');
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      expect(saved).toBe(true);
    });

    test('18. Asserts clicking "SAVE" with an empty RX table shows a validation warning/toast', async ({ page }) => {
      await page.goto(`/doctor/consultation/${mockVisitId}`);

      // Ensure drug name is empty
      await page.fill('[data-testid="input-drug-0"]', '');

      await page.click('[data-testid="btn-save-prescription"]');
      const errorToast = page.locator('[data-testid="toast-error"]');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText('Please add at least one medication');
    });

    test('19. Asserts clicking "SAVE" with valid data triggers a mock API call and shows a Success Toast', async ({ page }) => {
      let payloadCaptured = null;
      await page.route('**/api/v1/prescriptions/full', async (route) => {
        payloadCaptured = JSON.parse(route.request().postData());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'completed' }),
        });
      });

      await page.goto(`/doctor/consultation/${mockVisitId}`);
      await page.fill('[data-testid="input-brand-0"]', 'Dolo 650');
      await page.fill('[data-testid="input-drug-0"]', 'Paracetamol 650mg');
      await page.fill('[data-testid="input-doc-fee"]', '300');

      await page.click('[data-testid="btn-save-prescription"]');

      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
      expect(payloadCaptured).not.toBeNull();
      expect(payloadCaptured.medicines[0].drug_name).toBe('Paracetamol 650mg');
      expect(payloadCaptured.plan_and_billing.doctor_fee).toBe(300);
    });

    test('20. Asserts clicking "PRINT PRESCRIPTION" triggers the print preview/modal function', async ({ page }) => {
      await page.route('**/api/v1/prescriptions/full', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'completed' }),
        });
      });

      await page.goto(`/doctor/consultation/${mockVisitId}`);
      await page.fill('[data-testid="input-drug-0"]', 'Paracetamol 650mg');

      await page.click('[data-testid="btn-print-prescription"]');

      // Assert Printable Modal dialog is displayed
      await expect(page.locator('text=Prescription Receipt')).toBeVisible();
    });
  });
});
