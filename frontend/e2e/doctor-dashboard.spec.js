import { test, expect } from '@playwright/test';

test.describe('Doctor Consultation Desk & Patient Queue E2E Test Suite', () => {
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
        waiting_minutes: 12, // Normal (<15m)
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
        waiting_minutes: 20, // Warning tier (15-30m)
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
        waiting_minutes: 45, // Critical tier (>30m)
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

  // 1. HAPPY PATH & WORKFLOW AUTOMATION
  test('Scenario 1: Happy Path - Loads Desk, renders compact calendar, and triggers status update on row click', async ({ page }) => {
    let statusUpdated = false;

    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData),
      });
    });

    await page.route('**/api/v1/visits/101', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON();
        if (body.status === 'in_consultation') {
          statusUpdated = true;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 101, status: 'in_consultation' }),
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({}) });
      }
    });

    await page.goto('/doctor/queue');

    // Verify Title & Compact Calendar
    await expect(page.locator('.consultation-desk-title')).toHaveText('Consultation Desk');
    await expect(page.locator('.calendar-compact-icon')).toBeVisible();

    // Verify 6 KPI Values
    await expect(page.locator('[data-testid="kpi-total_patients"]')).toHaveText('12');
    await expect(page.locator('[data-testid="kpi-waiting"]')).toHaveText('4');

    // Verify Patient Queue Table rows
    const row1 = page.locator('[data-testid="queue-row-101"]');
    await expect(row1).toContainText('Rajesh Kumar');
    await expect(row1).toContainText('44 Yrs / M');
    await expect(row1).toContainText('PAT-00001');

    // Click Patient Row -> Assert Automated Status Mutation & Navigation
    await row1.click();
    expect(statusUpdated).toBeTruthy();
    await expect(page).toHaveURL(/\/doctor\/consultation\/101/);
  });

  // 2. FUNCTIONAL SEGMENTED CATEGORY FILTERING
  test('Scenario 2: Segmented Category Control filters patient queue dynamically', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData),
      });
    });

    await page.goto('/doctor/queue');

    // Initially All 3 patients visible
    await expect(page.locator('[data-testid="patient-queue-table"] tbody tr.patient-data-row')).toHaveCount(3);

    // Click "Emergency" Category Pill
    await page.locator('[data-testid="category-tab-emergency"]').click();
    await expect(page.locator('[data-testid="patient-queue-table"] tbody tr.patient-data-row')).toHaveCount(1);
    await expect(page.locator('[data-testid="queue-row-103"]')).toContainText('Murugan Swamy');

    // Click "Follow-up" Category Pill
    await page.locator('[data-testid="category-tab-follow-up"]').click();
    await expect(page.locator('[data-testid="patient-queue-table"] tbody tr.patient-data-row')).toHaveCount(1);
    await expect(page.locator('[data-testid="queue-row-102"]')).toContainText('Ananya Sharma');

    // Click "All" -> returns all 3 patients
    await page.locator('[data-testid="category-tab-all"]').click();
    await expect(page.locator('[data-testid="patient-queue-table"] tbody tr.patient-data-row')).toHaveCount(3);
  });

  // 3. STANDARDIZED WAITING TIME BADGE TIERS
  test('Scenario 3: Standardized WaitingTimeBadge displays correct color tiers', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData),
      });
    });

    await page.goto('/doctor/queue');

    // Row 1: 12 min (<= 15 min) -> Normal Slate badge
    const badge1 = page.locator('[data-testid="queue-row-101"] .waiting-time-badge');
    await expect(badge1).toHaveClass(/waiting-badge-normal/);
    await expect(badge1).toContainText('12 min');

    // Row 2: 20 min (15-30 min) -> Warning Amber badge
    const badge2 = page.locator('[data-testid="queue-row-102"] .waiting-time-badge');
    await expect(badge2).toHaveClass(/waiting-badge-warning/);
    await expect(badge2).toContainText('20 min');

    // Row 3: 45 min (> 30 min) -> Critical Red badge
    const badge3 = page.locator('[data-testid="queue-row-103"] .waiting-time-badge');
    await expect(badge3).toHaveClass(/waiting-badge-critical/);
    await expect(badge3).toContainText('45 min');
  });

  // 4. EMPTY STATE & CLEAR FILTERS ACTION
  test('Scenario 4: Empty State renders "Clear Filters" button when category has 0 results', async ({ page }) => {
    await page.route('**/api/v1/doctor/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
              visit_id: 101,
              visit_number: 'V-101',
              patient_id: 'PAT-00001',
              numeric_patient_id: 1,
              patient_name: 'Rajesh Kumar',
              age_sex: '44 Yrs / M',
              category: 'OPD',
              waiting_time: '10 min',
              waiting_minutes: 10,
              remarks: 'Fever',
              status: 'vitals_done',
              created_at: new Date().toISOString(),
            },
          ],
          date: '22 Aug 2026',
        }),
      });
    });

    await page.goto('/doctor/queue');

    // Click "Emergency" (0 patients)
    await page.locator('[data-testid="category-tab-emergency"]').click();

    // Verify Empty State & Clear Filters button
    const emptyHeading = page.locator('.empty-queue-heading');
    await expect(emptyHeading).toHaveText('No EMERGENCY Patients Found');

    const clearBtn = page.locator('.btn-clear-filters');
    await expect(clearBtn).toBeVisible();

    // Click Clear Filters -> resets to 'All'
    await clearBtn.click();
    await expect(page.locator('[data-testid="patient-queue-table"] tbody tr.patient-data-row')).toHaveCount(1);
  });
});
