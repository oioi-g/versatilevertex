import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';

test.describe('Forgot Password Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/forgotpasswordpage');
    await expect(page.getByRole('heading', { name: /Reset Your Password/i })).toBeVisible();
  });

  test('should show validation error for empty email submission', async ({ page }) => {
    await page.getByRole('button', { name: /Send Reset Link/i }).click();
    await expect(page.locator('p.MuiFormHelperText-root.Mui-error')).toHaveText('Email is required');
  });

  test('should show success message for valid email submission', async ({ page }) => {
    await page.getByLabel('Email Address').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /Send Reset Link/i }).click();
    await expect(page.locator('.MuiAlert-message')).toHaveText(`Password reset email sent to ${TEST_EMAIL}. Check your inbox!`, { timeout: 7000 });
  });

  test('should have working login link', async ({ page }) => {
    await page.getByRole('link', { name: /Log In Instead/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/loginpage');
  });
});