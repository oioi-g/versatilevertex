import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';
const TEST_BOARD_ID = 'cYuUpXeNUoxqn5ibVHhA';

test.describe('Board Details Page E2E (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');
    await page.goto(`http://localhost:3000/userboardspage/${TEST_BOARD_ID}`);
    await expect(page.getByText(/All Images/i)).toBeVisible({ timeout: 15000 });
  });

  test('should display collage area and action buttons', async ({ page }) => {
    await expect(page.locator('text=Undo')).toBeVisible();
    await expect(page.locator('text=Redo')).toBeVisible();
    await expect(page.locator('text=Save as Draft')).toBeVisible();
    await expect(page.locator('text=Post Collage')).toBeVisible();
  });

  test('should allow flipping an image', async ({ page }) => {
    const image = page.locator('.pinContainer img').first();
    if (await image.isVisible()) {
      await image.click();
      await expect(page.getByRole('button', { name: /Flip/i })).toBeVisible();
      await page.getByRole('button', { name: /Flip/i }).click();
    } 
    else {
      test.skip();
    }
  });

  test('should open and cancel Save Draft modal', async ({ page }) => {
    await page.getByRole('button', { name: /Save as Draft/i }).click();
    await expect(page.getByText(/Name Your Draft/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should open and cancel Post Collage modal', async ({ page }) => {
    await page.getByRole('button', { name: /Post Collage/i }).click();
    await expect(page.getByText(/Name Your Collage/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should open and cancel Delete Board modal', async ({ page }) => {
    await page.getByRole('button', { name: /Delete Board/i }).click();
    await expect(page.getByText(/This action cannot be undone/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should show image thumbnails and allow image click', async ({ page }) => {
    const thumbnail = page.locator('img').nth(0);
    await expect(thumbnail).toBeVisible();
    await thumbnail.click();
  });
});