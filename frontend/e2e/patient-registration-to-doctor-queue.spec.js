import { test, expect } from '@playwright/test';

test.describe('Patient Registration to Doctor Desk Queue End-to-End Workflow', () => {
  const registeredPatient = {
    patient: {
      id: 501,
      patient_id: 'PAT-50001',
      barcode: 'PAT-50001',
      full_name: 'Vikramaditya Sharma',
      name: 'Vikramaditya Sharma',
      age: 38,
      age_years: 38,
      age_format: 'Years',
      gender: 'Male',
      phone: '9876543210',
      phone_number: '9876543210',
      created_at: new Date().toISOString(),
    },
    visit: {
      id: 801,
      visit_number: 'V-20260822-801',
      patient_id: 501,
      consultant_assigned: 'Dr. T.S.Jeyagowthaman',
      status: 'vitals_done',
      created_at: new Date().toISOString(),
    },
    vitals: {
      id: 901,
      visit_id: 801,
      weight_kg: 72.5,
      height_cm: 175,
      bmi: 23.7,
      bp_systolic: 120,
      bp_diastolic: 80,
      blood_pressure: '120/80',
      temperature_f: 98.6,
      spo2_percent: 99,
      pulse_rate_bpm: 72,
      grbs_mg_dl: 105,
      consultant_assigned: 'Dr. T.S.Jeyagowthaman',
      remarks: 'Normal clinical evaluation',
    },
  };

  let doctorQueueData = {
    kpis: {
      total_patients: 1,
      waiting: 1,
      followup: 0,
      reports_pending: 0,
      not_attended: 0,
      completed: 0,
    },
    queue: [
      {
        queue_no: 1,
        visit_id: 801,
        visit_number: 'V-20260822-801',
        patient_id: 'PAT-50001',
        numeric_patient_id: 501,
        patient_name: 'Vikramaditya Sharma',
        age_sex: '38 Yrs / M',
        age: 38,
        gender: 'Male',
        category: 'OPD',
        waiting_time: '< 1 min',
        waiting_minutes: 0,
        remarks: 'Normal clinical evaluation',
        status: 'vitals_done',
        consultant_assigned: 'Dr. T.S.Jeyagowthaman',
        created_at: new Date().toISOString(),
      },
    ],
    date: '22 Aug 2026',
  };

  test.beforeEach(async ({ page }) => {
    // Mock user login / auth token in localStorage (Admin/Receptionist/Doctor)
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          username: 'admin',
          full_name: 'Hospital Administrator',
          role: 'admin',
        })
      );
    });
  });

  test('Complete Workflow: Register New Patient -> Verify Registration Sidebar Queue -> Verify Doctor Consultation Queue', async ({ page }) => {
    // 1. Setup API Mock Handlers
    let registeredVisits = [];

    // Mock GET /api/v1/visits/reception-today
    await page.route('**/api/v1/visits/reception-today*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(registeredVisits),
      });
    });

    // Mock POST /api/v1/patients/register
    await page.route('**/api/v1/patients/register*', async (route) => {
      registeredVisits = [
        {
          id: registeredPatient.visit.id,
          patient_id: registeredPatient.patient.id,
          patient_name: registeredPatient.patient.full_name,
          patient_phone: registeredPatient.patient.phone,
          patient_gender: registeredPatient.patient.gender,
          patient_age: registeredPatient.patient.age,
          visit_number: registeredPatient.visit.visit_number,
          status: 'vitals_done',
          created_at: new Date().toISOString(),
        },
      ];

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(registeredPatient),
      });
    });

    // Mock GET /api/v1/doctor/dashboard
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(doctorQueueData),
      });
    });

    // =========================================================================
    // STEP 1: Navigate to Registration Page & Fill Demographics + Vitals Form
    // =========================================================================
    await page.goto('/reception/register');
    await expect(page.locator('.header-page-title')).toContainText('Patient Registration');

    // Fill Demographics Fields
    await page.fill('#reg-full-name', 'Vikramaditya Sharma');
    await page.fill('#reg-age', '38');
    await page.fill('#reg-phone', '9876543210');
    await page.fill('#reg-guardian', 'Devendra Sharma');

    // Fill Vitals Fields
    await page.fill('#vit-weight', '72.5');
    await page.fill('#vit-height', '175');
    await page.fill('#vit-bp-systolic', '120');
    await page.fill('#vit-bp-diastolic', '80');
    await page.fill('#vit-pulse', '72');
    await page.fill('#vit-temp', '98.6');
    await page.fill('#vit-spo2', '99');

    // Click "Save & Add New Patient"
    const saveButton = page.locator('button:has-text("Save & Add New Patient")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // =========================================================================
    // STEP 2: Assert Success Banner & Verify Patient Instant Appearance in Sidebar Queue
    // =========================================================================
    const successBanner = page.locator('.alert-banner-success');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('Patient Registered & Added to Queue');
    await expect(successBanner).toContainText('Vikramaditya Sharma');

    // Verify patient appears in the Sidebar Queue
    const todayQueueList = page.locator('.today-visits-list');
    await expect(todayQueueList).toBeVisible();
    await expect(todayQueueList).toContainText('Vikramaditya Sharma');
    await expect(todayQueueList).toContainText('V-20260822-801');

    // =========================================================================
    // STEP 3: Navigate to Doctor Desk & Verify Patient in Doctor's Queue
    // =========================================================================
    await page.goto('/doctor/queue');
    await expect(page.locator('.consultation-desk-title')).toHaveText('Consultation Desk');

    // Verify KPIs
    await expect(page.locator('[data-testid="kpi-total_patients"]')).toHaveText('1');
    await expect(page.locator('[data-testid="kpi-waiting"]')).toHaveText('1');

    // Verify Patient row in Doctor Desk Table
    const doctorQueueTable = page.locator('[data-testid="patient-queue-table"]');
    await expect(doctorQueueTable).toBeVisible();

    const patientRow = page.locator('[data-testid="queue-row-801"]');
    await expect(patientRow).toBeVisible();
    await expect(patientRow).toContainText('Vikramaditya Sharma');
    await expect(patientRow).toContainText('38 Yrs / M');
    await expect(patientRow).toContainText('PAT-50001');

    // Verify Waiting Time Badge is present
    const waitingBadge = patientRow.locator('.waiting-time-badge');
    await expect(waitingBadge).toBeVisible();
    await expect(waitingBadge).toHaveClass(/waiting-badge-normal/);
  });
});
