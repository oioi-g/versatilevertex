import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'andok3268@gmail.com';
const TEST_PASSWORD = 'pass@123';

test.describe('Create Challenge Page E2E (Admin)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');
    await page.goto('http://localhost:3000/admin/createchallengepage');
    await expect(page.getByText(/Create New Challenge/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error if fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: /Create Challenge/i }).click();
    await expect(page.locator('text=Please fill out all fields.')).toBeVisible();
  });

  test('should successfully create a new challenge', async ({ page }) => {
    const now = new Date();
    const future = new Date(now.getTime() + 86400000).toISOString().slice(0, 16);
    await page.getByPlaceholder('Title').fill('Test Challenge');
    await page.getByPlaceholder('Description').fill('This is a test design challenge.');
    await page.getByPlaceholder('Deadline').fill(future);
    await page.getByRole('button', { name: /Create Challenge/i }).click();
    await page.waitForURL('**/userdesignchallengespage', { timeout: 10000 });
  });
});