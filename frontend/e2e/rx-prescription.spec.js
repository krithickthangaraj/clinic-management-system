import { test, expect } from '@playwright/test';

test.describe('RX Prescription Core Module End-to-End Test Suite', () => {
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
    bp_systolic: 145, // High BP -> should trigger danger badge
    bp_diastolic: 95,
    blood_pressure: '145/95',
    temperature_f: 99.8, // High temp -> should trigger danger badge
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

    await page.route('**/api/v1/medicines*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Paracetamol 650mg', brand_name: 'Dolo 650', generic_name: 'Paracetamol' },
          { id: 2, name: 'Amoxicillin 500mg', brand_name: 'Augmentin 625', generic_name: 'Amoxicillin + Clav' },
          { id: 3, name: 'Pantoprazole 40mg', brand_name: 'Pan 40', generic_name: 'Pantoprazole' },
        ]),
      });
    });
  });

  test('Scenario 1: Dynamic RX Table - Add 3 rows, fill them out, delete 2nd row, and assert state integrity', async ({ page }) => {
    await page.goto(`/doctor/consultation/${mockVisitId}`);

    // Wait for table to load
    const rxTable = page.locator('[data-testid="rx-medication-table"]');
    await expect(rxTable).toBeVisible();

    // 1st Row is already present by default
    await page.fill('[data-testid="input-brand-0"]', 'Dolo 650');
    await page.fill('[data-testid="input-drug-0"]', 'Paracetamol 650mg');

    // Add 2nd row
    await page.click('[data-testid="btn-add-drug"]');
    await page.fill('[data-testid="input-brand-1"]', 'Pan 40');
    await page.fill('[data-testid="input-drug-1"]', 'Pantoprazole 40mg');

    // Add 3rd row
    await page.click('[data-testid="btn-add-drug"]');
    await page.fill('[data-testid="input-brand-2"]', 'Augmentin 625');
    await page.fill('[data-testid="input-drug-2"]', 'Amoxicillin 500mg');

    // Verify all 3 rows exist
    await expect(page.locator('[data-testid="rx-row-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="rx-row-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="rx-row-2"]')).toBeVisible();

    // Delete the 2nd row (Pan 40 / Pantoprazole)
    await page.click('[data-testid="btn-remove-1"]');

    // Verify 2 rows remain and data integrity is preserved
    await expect(page.locator('[data-testid="input-brand-0"]')).toHaveValue('Dolo 650');
    await expect(page.locator('[data-testid="input-drug-0"]')).toHaveValue('Paracetamol 650mg');

    await expect(page.locator('[data-testid="input-brand-1"]')).toHaveValue('Augmentin 625');
    await expect(page.locator('[data-testid="input-drug-1"]')).toHaveValue('Amoxicillin 500mg');
  });

  test('Scenario 2: Auto-Calculation - Dosage(1 Tab) * Frequency(TDS 1-1-1) * Days(5) => Quantity(15)', async ({ page }) => {
    await page.goto(`/doctor/consultation/${mockVisitId}`);

    const dosageInput = page.locator('[data-testid="input-dosage-0"]');
    const freqSelect = page.locator('[data-testid="select-freq-0"]');
    const daysInput = page.locator('[data-testid="input-days-0"]');
    const qtyInput = page.locator('[data-testid="input-quantity-0"]');

    // Fill row 1: Dosage: 1 Tab, Frequency: TDS (1-1-1), Days: 5
    await dosageInput.fill('1 Tab');
    await freqSelect.selectOption('TDS (1-1-1)');
    await daysInput.fill('5');

    // Assert quantity auto-calculates to 15 (1 * 3 * 5)
    await expect(qtyInput).toHaveValue('15');

    // Update Days to 10 -> Quantity should automatically update to 30 (1 * 3 * 10)
    await daysInput.fill('10');
    await expect(qtyInput).toHaveValue('30');

    // Update Frequency to BD (1-0-1) -> Quantity should update to 20 (1 * 2 * 10)
    await freqSelect.selectOption('BD (1-0-1)');
    await expect(qtyInput).toHaveValue('20');
  });

  test('Scenario 3: Save Workflow - Save full prescription and assert success toast', async ({ page }) => {
    let savedPayload = null;
    await page.route('**/api/v1/prescriptions/full', async (route) => {
      savedPayload = JSON.parse(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prescription_id: 99,
          visit_id: 101,
          patient_id: 201,
          visit_number: 'V-20260822-101',
          created_at: new Date().toISOString(),
          status: 'in_consultation',
          history: savedPayload.history,
          assessment: savedPayload.assessment,
          medicines: savedPayload.medicines,
          plan_and_billing: savedPayload.plan_and_billing,
        }),
      });
    });

    await page.goto(`/doctor/consultation/${mockVisitId}`);

    // Fill drug details
    await page.fill('[data-testid="input-drug-0"]', 'Paracetamol 650mg');
    await page.fill('[data-testid="input-brand-0"]', 'Dolo 650');

    // Click SAVE button
    const saveBtn = page.locator('[data-testid="btn-save-prescription"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Assert success feedback
    await expect(page.locator('text=Prescription saved successfully')).toBeVisible();
    expect(savedPayload).not.toBeNull();
    expect(savedPayload.medicines.length).toBe(1);
    expect(savedPayload.medicines[0].drug_name).toBe('Paracetamol 650mg');
  });
});
