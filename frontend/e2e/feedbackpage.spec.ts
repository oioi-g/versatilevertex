import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';

test.describe('Feedback Page E2E (Authenticated)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');
    await page.goto('http://localhost:3000/feedbackpage');
    await expect(page.getByRole('heading', { name: /Share Your Feedback/i })).toBeVisible();
  });

  test('should show validation error for short feedback', async ({ page }) => {
    await page.getByPlaceholder('Your Feedback').fill('Too short');
    await page.getByRole('button', { name: /Submit Feedback/i }).click();
    await expect(page.locator('p.MuiFormHelperText-root.Mui-error')).toHaveText('Feedback must be at least 10 characters.');
  });

  test('should submit feedback successfully', async ({ page }) => {
    await page.getByPlaceholder('Your Feedback').fill('This platform is amazing! Loved the collage features.');
    await page.getByRole('button', { name: /Submit Feedback/i }).click();
    await expect(page.locator('.MuiAlert-message')).toHaveText(/Thank you for your feedback!/i, { timeout: 7000 });
  });
});