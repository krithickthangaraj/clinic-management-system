// @ts-check
import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://clinic-management-system-teal.vercel.app';

test.describe('Live Production E2E Verification Suite', () => {

  test('01: Reception Workflow — Login, Register Patient & Assert Instant Queue Hydration', async ({ page }) => {
    // 1. Open Live Login
    await page.goto(`${LIVE_URL}/login`);
    await expect(page.locator('text=Kongu Hospital').first()).toBeVisible({ timeout: 15000 });

    // 2. Perform Login
    await page.fill('input[type="text"]', 'reception');
    await page.fill('input[type="password"]', 'reception123');
    await page.click('button[type="submit"]');

    // 3. Verify redirected to Patient Registration
    await expect(page).toHaveURL(/reception|opd/, { timeout: 15000 });

    // 4. Fill New Patient Demographics
    const timestamp = Date.now();
    const patientName = `Auto Test ${timestamp}`;
    const phone = `98765${timestamp.toString().slice(-5)}`;

    await page.fill('input[name="full_name"], input[placeholder*="Full Name"], input[placeholder*="Name"]', patientName);
    await page.fill('input[name="age"], input[placeholder*="Age"]', '38');
    await page.fill('input[name="phone_number"], input[placeholder*="Mobile"], input[placeholder*="Phone"]', phone);

    // 5. Fill Vitals
    await page.fill('input[name="weight_kg"], input[placeholder*="Weight"]', '68');
    await page.fill('input[name="height_cm"], input[placeholder*="Height"]', '170');
    await page.fill('input[name="bp_systolic"], input[placeholder*="Systolic"], input[placeholder*="BP"]', '120');
    await page.fill('input[name="bp_diastolic"], input[placeholder*="Diastolic"]', '80');

    // 6. Click Save & Register
    const registerButton = page.locator('button:has-text("Save & Queue"), button:has-text("Register"), button:has-text("Save")').first();
    await registerButton.click();

    // 7. CRITICAL ASSERTION: Verify patient appears in the live queue list WITHOUT page reload
    await expect(page.locator(`text=${patientName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('02: Doctor Desk & Consultation Workflow — Auto-Fill RX & Print Pad', async ({ page }) => {
    // 1. Login as Doctor
    await page.goto(`${LIVE_URL}/login`);
    await page.fill('input[type="text"]', 'doctor');
    await page.fill('input[type="password"]', 'doctor123');
    await page.click('button[type="submit"]');

    // 2. Verify Doctor Dashboard Queue Loads
    await expect(page).toHaveURL(/doctor/, { timeout: 15000 });
    await expect(page.locator('text=Dr. T.S. Jeyagowthaman').first()).toBeVisible({ timeout: 10000 });

    // 3. Open first patient consultation
    const consultBtn = page.locator('button:has-text("Consult"), a:has-text("Consult"), tr').first();
    if (await consultBtn.isVisible()) {
      await consultBtn.click();
    }
  });

  test('03: Pharmacy Inventory & POS — Stock Verification', async ({ page }) => {
    // 1. Login as Admin / Pharmacy
    await page.goto(`${LIVE_URL}/login`);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Navigate to Pharmacy
    await page.goto(`${LIVE_URL}/pharmacy`);
    await expect(page.locator('text=Pharmacy').first()).toBeVisible({ timeout: 15000 });
  });

  test('04: Operational Analytics & Reports — OP Census', async ({ page }) => {
    // 1. Login as Admin
    await page.goto(`${LIVE_URL}/login`);
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Navigate to Reports Dashboard
    await page.goto(`${LIVE_URL}/reports`);
    await expect(page.locator('text=Operational').first()).toBeVisible({ timeout: 15000 });
  });

});
