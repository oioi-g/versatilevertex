import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';

test.describe('User Profile Page E2E (Authenticated)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage', { timeout: 15000 });
    await page.goto('http://localhost:3000/userprofilepage');
    await expect(page.getByRole('button', { name: /Followers/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display profile avatar, username, and buttons', async ({ page }) => {
    await expect(page.locator('img[alt="Profile"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Followers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Following/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Change Details/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Likes/i })).toBeVisible();
  });

  test('should open followers modal', async ({ page }) => {
    await page.getByRole('button', { name: /Followers/i }).click();
    await expect(page.getByRole('heading', { name: /Followers/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should open following modal', async ({ page }) => {
    await page.getByRole('button', { name: /Following/i }).click();
    await expect(page.getByRole('heading', { name: /Following/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should open profile image upload modal and cancel', async ({ page }) => {
    await page.locator('img[alt="Profile"]').click();
    await expect(page.getByText(/Upload Profile Image/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should navigate to change details page', async ({ page }) => {
    await page.getByRole('button', { name: /Change Details/i }).click();
    await expect(page.getByText(/Edit Profile/i)).toBeVisible();
  });

  test('should navigate to liked page', async ({ page }) => {
    await page.getByRole('button', { name: /View Likes/i }).click();
    await expect(page.getByText(/Liked Images/i)).toBeVisible();
  });

  test('should navigate to drafts page', async ({ page }) => {
    await page.getByRole('button', { name: /View Drafts/i }).click();
    await expect(page.getByText(/My Drafts/i)).toBeVisible();
  });
});