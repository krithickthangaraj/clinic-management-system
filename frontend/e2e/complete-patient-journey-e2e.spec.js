import { test, expect } from '@playwright/test';

test.describe('Complete Patient Journey End-to-End Test (Registration -> Queue -> RX Consultation -> Save)', () => {
  const newPatientId = 701;
  const newVisitId = 901;
  const patientFullName = 'Devendra Singhania';

  let currentVisitStatus = 'vitals_done';
  let queueData = [];

  test.beforeEach(async ({ page }) => {
    // 1. Mock Authentication Token & Role (Admin/Doctor)
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

    // 2. Setup Mock API Routes
    queueData = [];

    // Mock GET /api/v1/visits/reception-today
    await page.route('**/api/v1/visits/reception-today*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(queueData),
      });
    });

    // Mock POST /api/v1/patients/register
    await page.route('**/api/v1/patients/register*', async (route) => {
      const newVisitItem = {
        id: newVisitId,
        visit_number: `V-20260822-${newVisitId}`,
        patient_id: newPatientId,
        patient_name: patientFullName,
        patient_phone: '9840198401',
        patient_gender: 'Male',
        patient_age: 42,
        consultant_assigned: 'Dr. T.S.Jeyagowthaman',
        status: 'vitals_done',
        created_at: new Date().toISOString(),
      };
      queueData = [newVisitItem];

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          patient: {
            id: newPatientId,
            patient_id: 'PAT-70001',
            full_name: patientFullName,
            name: patientFullName,
            phone: '9840198401',
            gender: 'Male',
            age: 42,
          },
          visit: newVisitItem,
          vitals: {
            id: 1001,
            visit_id: newVisitId,
            weight_kg: 76.5,
            height_cm: 174,
            blood_pressure: '130/85',
            temperature_f: 98.6,
            spo2_percent: 98,
            pulse_rate_bpm: 76,
          },
        }),
      });
    });

    // Mock GET /api/v1/doctor/dashboard
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpis: {
            total_patients: queueData.length,
            waiting: currentVisitStatus === 'completed' ? 0 : queueData.length,
            completed: currentVisitStatus === 'completed' ? 1 : 0,
          },
          queue: queueData.map((v, idx) => ({
            queue_no: idx + 1,
            visit_id: v.id,
            visit_number: v.visit_number,
            patient_id: 'PAT-70001',
            numeric_patient_id: v.patient_id,
            patient_name: v.patient_name,
            age_sex: `${v.patient_age} Yrs / M`,
            category: 'OPD',
            waiting_time: '< 1 min',
            waiting_minutes: 0,
            status: currentVisitStatus,
            consultant_assigned: v.consultant_assigned,
            created_at: v.created_at,
          })),
          date: '22 Aug 2026',
        }),
      });
    });

    // Mock GET /api/v1/visits/:visitId
    await page.route(`**/api/v1/visits/${newVisitId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: newVisitId,
          visit_number: `V-20260822-${newVisitId}`,
          patient_id: newPatientId,
          consultant_assigned: 'Dr. T.S.Jeyagowthaman',
          status: currentVisitStatus,
          patient: {
            id: newPatientId,
            patient_id: 'PAT-70001',
            name: patientFullName,
            age: 42,
            gender: 'Male',
            phone: '9840198401',
          },
        }),
      });
    });

    // Mock GET /api/v1/vitals/visit/:visitId
    await page.route(`**/api/v1/vitals/visit/${newVisitId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1001,
          visit_id: newVisitId,
          weight_kg: 76.5,
          height_cm: 174,
          bmi: 25.3,
          blood_pressure: '130/85',
          temperature_f: 98.6,
          spo2_percent: 98,
          pulse_rate_bpm: 76,
        }),
      });
    });

    // Mock GET /api/v1/prescriptions/full/:visitId
    await page.route(`**/api/v1/prescriptions/full/${newVisitId}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No existing prescription' }),
      });
    });

    // Mock POST /api/v1/prescriptions/full
    await page.route('**/api/v1/prescriptions/full', async (route) => {
      const payload = JSON.parse(route.request().postData());
      currentVisitStatus = 'completed';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prescription_id: 888,
          visit_id: newVisitId,
          patient_id: newPatientId,
          visit_number: `V-20260822-${newVisitId}`,
          created_at: new Date().toISOString(),
          status: 'completed',
          history: payload.history,
          assessment: payload.assessment,
          medicines: payload.medicines,
          plan_and_billing: payload.plan_and_billing,
        }),
      });
    });
  });

  test('Single Continuous Journey: Register Patient -> Doctor Queue -> RX Prescription -> Verified Save', async ({ page }) => {
    // =========================================================================
    // PHASE 1: REGISTRATION
    // =========================================================================
    await page.goto('/reception/register');
    await expect(page.locator('.header-page-title')).toContainText('Patient Registration');

    // Fill Demographics
    await page.fill('#reg-full-name', patientFullName);
    await page.fill('#reg-age', '42');
    await page.fill('#reg-phone', '9840198401');

    // Fill Vitals
    await page.fill('#vit-weight', '76.5');
    await page.fill('#vit-height', '174');
    await page.fill('#vit-bp-systolic', '130');
    await page.fill('#vit-bp-diastolic', '85');
    await page.fill('#vit-pulse', '76');

    // Submit Registration
    await page.click('button:has-text("Save & Add New Patient")');

    // Assert Registration Success Toast/Banner
    const successBanner = page.locator('.alert-banner-success');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText(patientFullName);

    // =========================================================================
    // PHASE 2: DOCTOR DESK & QUEUE
    // =========================================================================
    await page.goto('/doctor/queue');
    await expect(page.locator('.consultation-desk-title')).toHaveText('Consultation Desk');

    // Verify patient in Doctor Desk Queue
    const patientRow = page.locator(`[data-testid="queue-row-${newVisitId}"]`);
    await expect(patientRow).toBeVisible();
    await expect(patientRow).toContainText(patientFullName);

    // Click on the patient row to navigate to RX Consultation view
    await patientRow.click();
    await expect(page).toHaveURL(new RegExp(`/doctor/consultation/${newVisitId}`));

    // =========================================================================
    // PHASE 3: RX PRESCRIPTION (ADDING MEDICINE)
    // =========================================================================
    // Assert Consultation Ribbon Header
    await expect(page.locator('.patient-vitals-ribbon')).toBeVisible();
    await expect(page.locator('.ribbon-name')).toContainText(patientFullName);

    // Fill Clinical Assessment
    const complaintInput = page.locator('.assessment-text-input').first();
    await complaintInput.fill('Fever with dry cough for 3 days');
    await page.click('.btn-assessment-add >> nth=0');

    // Fill RX Medication Table
    await page.fill('[data-testid="input-brand-0"]', 'Dolo 650');
    await page.fill('[data-testid="input-drug-0"]', 'Paracetamol 650mg');
    await page.fill('[data-testid="input-dosage-0"]', '1 Tab');
    await page.selectOption('[data-testid="select-freq-0"]', 'TDS (1-1-1)');
    await page.fill('[data-testid="input-days-0"]', '5');

    // Verify Auto-Calculation: 1 Tab * TDS(3) * 5 Days = 15 Quantity
    await expect(page.locator('[data-testid="input-quantity-0"]')).toHaveValue('15');

    // Add a 2nd medicine (Pan 40)
    await page.click('[data-testid="btn-add-drug"]');
    await page.fill('[data-testid="input-brand-1"]', 'Pan 40');
    await page.fill('[data-testid="input-drug-1"]', 'Pantoprazole 40mg');
    await page.selectOption('[data-testid="select-freq-1"]', 'OD (1-0-0)');
    await page.fill('[data-testid="input-days-1"]', '5');

    // Verify Auto-Calculation: 1 Tab * OD(1) * 5 Days = 5 Quantity
    await expect(page.locator('[data-testid="input-quantity-1"]')).toHaveValue('5');

    // =========================================================================
    // PHASE 4: SAVE WORKFLOW & VERIFICATION
    // =========================================================================
    const saveBtn = page.locator('[data-testid="btn-save-prescription"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Assert UI Success Toast
    await expect(page.locator('text=Prescription saved successfully')).toBeVisible();

    // Verify redirect back to Doctor Desk Queue
    await page.waitForURL('**/doctor/queue', { timeout: 5000 });
    await expect(page.locator('.consultation-desk-title')).toHaveText('Consultation Desk');
  });
});
