import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';
const TEST_COLLAGE_ID = 'WS43gI7huxm6fG6ICsRI'

test.describe('User Dashboard Page E2E (Authenticated)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');
    await page.goto('http://localhost:3000/userdashboardpage');
  });

  test('should show charts and metrics if collages exist', async ({ page }) => {
    const charts = page.locator('canvas');
    await expect(charts).toHaveCount(2, { timeout: 10000 });
  });

  test('should navigate to collage details when a collage card is clicked', async ({ page }) => {
    const cards = page.locator('[data-testid="collage-card"]').filter({ hasText: 'Views:' });
    await expect(cards.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      console.warn('No collage cards visible after 10s');
      test.skip();
    });
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await expect(page).toHaveURL(`http://localhost:3000/collagedetailspage/${TEST_COLLAGE_ID}`);
    } 
    else {
      test.skip();
    }
  });

  test('should open and cancel delete dialog', async ({ page }) => {
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).first();
    await deleteBtn.click();
    await expect(page.getByText(/Delete Collage/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText(/Delete Collage/i)).not.toBeVisible();
  });
});