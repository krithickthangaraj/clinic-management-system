// @ts-check
import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://clinic-management-system-teal.vercel.app';

test('Test Returning Patient (Sudha) Registration & Queue Display', async ({ page }) => {
  // 1. Open Live Login
  await page.goto(`${LIVE_URL}/login`);
  await expect(page.locator('text=Kongu Hospital').first()).toBeVisible({ timeout: 15000 });

  // 2. Login as Receptionist
  await page.fill('input[type="text"]', 'reception');
  await page.fill('input[type="password"]', 'reception123');
  await page.click('button[type="submit"]');

  // 3. Wait for Patient Registration Page
  await expect(page).toHaveURL(/reception|opd/, { timeout: 15000 });

  // 4. Search for existing patient "Sudha"
  const searchInput = page.locator('input[placeholder*="Scan Barcode"]').first();
  await searchInput.fill('Sudha');
  
  // Wait for search result dropdown item and click it
  const dropdownItem = page.locator('.search-results-list li, .patient-search-results li, ul li:has-text("Sudha")').first();
  await expect(dropdownItem).toBeVisible({ timeout: 8000 });
  await dropdownItem.click();

  // 5. Verify Demographics auto-populated in the form
  const nameField = page.locator('input[name="full_name"], input[placeholder*="Rajesh Kumar"]').first();
  await expect(nameField).toBeVisible({ timeout: 5000 });

  // 6. Enter Today's Clinical Vitals
  const weightInput = page.locator('input[name="weight_kg"], input[placeholder*="Weight"]').first();
  await weightInput.fill('58');

  // 7. Click Save & Add New Patient / Save
  const saveBtn = page.locator('button:has-text("Save & Add"), button:has-text("Save"), button:has-text("Register")').last();
  await saveBtn.click();

  // 8. Verify Success Banner Appears
  await expect(page.locator('text=Sudha').first()).toBeVisible({ timeout: 10000 });

  // 9. Verify "Sudha" is in the live queue list
  const queueSection = page.locator('.registration-sidebar, aside');
  await expect(queueSection.locator('text=Sudha').first()).toBeVisible({ timeout: 10000 });
});
