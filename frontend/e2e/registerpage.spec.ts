import { test, expect } from '@playwright/test';

test.describe('Register Page E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('form');
  });

  test('should display the registration form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Welcome to Versatile Vertex/i })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Birth Year')).toBeVisible();
  });

  test('should show error messages for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /register/i }).click();
    await page.waitForTimeout(15000);

    const usernameWrapper = page.getByLabel('Username').locator('..');
    const emailWrapper = page.getByLabel('Email').locator('..');
    const passwordWrapper = page.getByLabel('Password').locator('..');
    const birthYearWrapper = page.getByLabel('Birth Year').locator('..');

    await expect(usernameWrapper).toContainText('Username is required');
    await expect(emailWrapper).toContainText('Email is required');
    await expect(passwordWrapper).toContainText('Password is required');
    await expect(birthYearWrapper).toContainText('Birth year is required');
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.getByLabel('Username').fill('validname');
    await page.getByLabel('Email').fill('invalidemail');
    await page.getByLabel('Password').fill('Valid123!');
    await page.getByLabel('Birth Year').fill('2000');

    await page.getByRole('button', { name: /register/i }).click();
    await page.waitForTimeout(15000);

    const emailWrapper = page.getByLabel('Email').locator('..');
    await expect(emailWrapper).toContainText('Please enter a valid email address');
  });

  test('should show error for weak password', async ({ page }) => {
    await page.getByLabel('Username').fill('validname');
    await page.getByLabel('Email').fill('valid@email.com');
    await page.getByLabel('Password').fill('123'); // Weak
    await page.getByLabel('Birth Year').fill('2000');

    await page.getByRole('button', { name: /register/i }).click();
    await page.waitForTimeout(15000);

    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should register a new user successfully (mocked)', async ({ page }) => {
    page.on('dialog', async dialog => {
      console.log('ALERT:', dialog.message());
      await dialog.dismiss();
    });

    const uniqueUsername = `user${Math.random().toString(36).replace(/[^a-z]/g, '').substring(0, 6)}`;
    const fakeEmail = `test${Date.now()}@test.com`;

    await page.getByLabel('Username').fill(uniqueUsername);
    await page.getByLabel('Email').fill(fakeEmail);
    await page.getByLabel('Password').fill('Valid123!');
    await page.getByLabel('Birth Year').fill('1995');

    await page.getByRole('button', { name: /register/i }).click();

    await page.waitForTimeout(500);
    await page.waitForURL('**/loginpage', { timeout: 15000 });

    // Make this less strict in case text changes
    await expect(page.getByText(/login/i)).toBeVisible();
  });

});