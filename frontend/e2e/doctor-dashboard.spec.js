import { test, expect } from '@playwright/test';

test.describe('Doctor Dashboard & Patient Queue E2E Test Suite', () => {
  const mockDashboardData = {
    kpis: {
      total_patients: 12,
      waiting: 4,
      followup: 3,
      reports_pending: 2,
      not_attended: 1,
      completed: 2,
    },
    queue: [
      {
        queue_no: 1,
        visit_id: 101,
        visit_number: 'V-20260822-001',
        patient_id: 'PAT-00001',
        numeric_patient_id: 1,
        patient_name: 'Rajesh Kumar',
        age_sex: '44 Yrs / M',
        category: 'OPD',
        waiting_time: '12 min',
        waiting_minutes: 12,
        remarks: 'Mild fever and dry cough for 3 days',
        status: 'vitals_done',
        created_at: new Date(Date.now() - 12 * 60000).toISOString(),
      },
      {
        queue_no: 2,
        visit_id: 102,
        visit_number: 'V-20260822-002',
        patient_id: 'PAT-00002',
        numeric_patient_id: 2,
        patient_name: 'Ananya Sharma',
        age_sex: '28 Yrs / F',
        category: 'Follow-up',
        waiting_time: '20 min',
        waiting_minutes: 20, // Warning threshold (>15m)
        remarks: 'BP Review post medication',
        status: 'vitals_done',
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      },
      {
        queue_no: 3,
        visit_id: 103,
        visit_number: 'V-20260822-003',
        patient_id: 'PAT-00003',
        numeric_patient_id: 3,
        patient_name: 'Murugan Swamy',
        age_sex: '56 Yrs / M',
        category: 'Emergency',
        waiting_time: '45 min',
        waiting_minutes: 45, // Urgent threshold (>30m)
        remarks: 'Chest discomfort and sweating',
        status: 'vitals_done',
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      },
    ],
    date: '22 Aug 2026',
  };

  test.beforeEach(async ({ page }) => {
    // Mock user login / auth token in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          username: 'doctor1',
          full_name: 'Dr. T.S.Jeyagowthaman',
          role: 'doctor',
        })
      );
    });
  });

  // 1. HAPPY PATH: Dashboard loads, KPIs render, table populates, row click navigates
  test('Scenario 1: Happy Path - Loads KPIs, renders dense table, and navigates to Doctor Desk', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData),
      });
    });

    await page.goto('/doctor/queue');

    // Verify Page Header & Navbar
    await expect(page.locator('.clinic-main-name')).toBeVisible();
    await expect(page.locator('.dashboard-page-title')).toHaveText('Doctor Consultation Desk');

    // Verify 6 KPI Values
    await expect(page.locator('[data-testid="kpi-total_patients"]')).toHaveText('12');
    await expect(page.locator('[data-testid="kpi-waiting"]')).toHaveText('4');
    await expect(page.locator('[data-testid="kpi-followup"]')).toHaveText('3');
    await expect(page.locator('[data-testid="kpi-reports_pending"]')).toHaveText('2');
    await expect(page.locator('[data-testid="kpi-not_attended"]')).toHaveText('1');
    await expect(page.locator('[data-testid="kpi-completed"]')).toHaveText('2');

    // Verify Patient Queue Table rows
    const table = page.locator('[data-testid="patient-queue-table"]');
    await expect(table).toBeVisible();

    const row1 = page.locator('[data-testid="queue-row-101"]');
    await expect(row1).toContainText('Rajesh Kumar');
    await expect(row1).toContainText('44 Yrs / M');
    await expect(row1).toContainText('PAT-00001');

    // Click Patient Row -> Assert Navigation to Consultation Desk URL
    await row1.click();
    await expect(page).toHaveURL(/\/doctor\/consultation\/101/);
  });

  // 2. EDGE CASE: Empty State with 0 Patients
  test('Scenario 2: Edge Case - 0 Patients displays clean Empty State without layout shift', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpis: {
            total_patients: 0,
            waiting: 0,
            followup: 0,
            reports_pending: 0,
            not_attended: 0,
            completed: 0,
          },
          queue: [],
          date: '22 Aug 2026',
        }),
      });
    });

    await page.goto('/doctor/queue');

    // All KPIs should display '0' (never undefined/null)
    await expect(page.locator('[data-testid="kpi-total_patients"]')).toHaveText('0');
    await expect(page.locator('[data-testid="kpi-waiting"]')).toHaveText('0');

    // Empty state container verification
    const emptyRow = page.locator('[data-testid="empty-queue-row"]');
    await expect(emptyRow).toBeVisible();
    await expect(page.locator('.empty-queue-heading')).toHaveText('No Patients in Queue');
  });

  // 3. EDGE CASE: Dynamic Waiting Times (Warning Amber > 15m, Urgent Red > 30m)
  test('Scenario 3: Dynamic Waiting Time styling thresholds (> 15m Amber, > 30m Red)', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData),
      });
    });

    await page.goto('/doctor/queue');

    // Row 1: 12 min (<= 15 min) -> Normal Slate class
    const chip1 = page.locator('[data-testid="queue-row-101"] [data-testid="waiting-time-cell"]');
    await expect(chip1).toHaveClass(/waiting-time-normal/);

    // Row 2: 20 min (> 15 min) -> Warning Amber class
    const chip2 = page.locator('[data-testid="queue-row-102"] [data-testid="waiting-time-cell"]');
    await expect(chip2).toHaveClass(/waiting-time-warning/);

    // Row 3: 45 min (> 30 min) -> Urgent Red class
    const chip3 = page.locator('[data-testid="queue-row-103"] [data-testid="waiting-time-cell"]');
    await expect(chip3).toHaveClass(/waiting-time-urgent/);
  });

  // 4. ERROR HANDLING: 500 Internal Server Error Graceful Recovery
  test('Scenario 4: Error Handling - 500 Internal Server Error displays graceful toast without crashing', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal Database Connection Failure' }),
      });
    });

    await page.goto('/doctor/queue');

    // Error banner should be visible
    const errorBanner = page.locator('[data-testid="dashboard-error-banner"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Unable to connect to clinic server');

    // The UI structure and TopNavigation must still remain intact (no blank crash screen)
    await expect(page.locator('.doctor-top-navbar')).toBeVisible();
    await expect(page.locator('.dashboard-page-title')).toBeVisible();
  });
});
