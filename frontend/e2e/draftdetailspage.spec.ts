import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';
const TEST_DRAFT_ID = '1plUGzFlWDIoE3cLYw0G';

test.describe('Draft Details Page E2E (Authenticated)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');

    await page.goto(`http://localhost:3000/draftdetailspage/${TEST_DRAFT_ID}`);
    await expect(page.locator('button', { hasText: 'Undo' })).toBeVisible({ timeout: 10000 });
  });

  test('should display collage area and basic action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Undo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Redo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Draft/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Post Collage/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete Draft/i })).toBeVisible();
  });

  test('should open and close Save Draft modal', async ({ page }) => {
    await page.getByRole('button', { name: /Save Draft/i }).click();
    await expect(page.getByText(/Name Your Draft/i)).toBeVisible();
    await page.getByRole('button', { name: /Save Draft/i }).click();
  });

  test('should open and close Post Collage modal', async ({ page }) => {
    await page.getByRole('button', { name: /Post Collage/i }).click();
    await expect(page.getByText(/Name Your Collage/i)).toBeVisible();
    await page.getByRole('button', { name: /Done/i }).click();
  });

  test('should open and cancel Delete Draft modal', async ({ page }) => {
    await page.getByRole('button', { name: /Delete Draft/i }).click();
    await expect(page.getByText(/Are you sure you want to delete this draft/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
  });

  test('should allow flipping image if an image is present', async ({ page }) => {
    const image = page.locator('.pinContainer img').first();
    if (await image.isVisible()) {
      await image.click();
      await page.getByRole('button', { name: /Flip/i }).click();
      await expect(page.locator('.pinContainer img').first()).toBeVisible();
    } 
    else {
      test.skip();
    }
  });

  test('should trigger background removal when "Remove Background" is clicked', async ({ page }) => {
    const image = page.locator('.pinContainer img').first();
    if (await image.isVisible()) {
      await image.click();
      const removeBgBtn = page.getByRole('button', { name: 'Remove Background', exact: true });
      await expect(removeBgBtn).toBeVisible();
      await removeBgBtn.click();
    } 
    else {
      test.skip();
    }
  });

  test('should allow removing image if an image is selected', async ({ page }) => {
    const image = page.locator('.pinContainer img').first();
    if (await image.isVisible()) {
      await image.click();
      await page.getByRole('button', { name: 'Remove', exact: true }).click();
    }
    else {
      test.skip();
    }
  });
});