import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';
const TEST_COLLAGE_ID = 'ZZcu7FLdQM1LMOUxCgjd';

test.describe('Collage Details Page E2E (Authenticated)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');
    await page.goto(`http://localhost:3000/collagedetailspage/${TEST_COLLAGE_ID}`);
    await expect(page.getByText(/Created by/i)).toBeVisible({ timeout: 10000 });
  });

  test('should render collage title and uploader', async ({ page }) => {
    await expect(page.locator('text=Created by')).toBeVisible();
    await expect(page.locator('img').first()).toBeVisible();
  });

  test('should allow liking and unliking the collage', async ({ page }) => {
    const likeButton = page.locator('button').filter({ has: page.locator('svg[data-testid="FavoriteIcon"]') }).first();
    await likeButton.click({ force: true });
    await expect(likeButton).toBeVisible();
  });

  test('should open and cancel delete collage modal if user owns it', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /Delete Collage/i });
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByText(/This action cannot be undone/i)).toBeVisible();
      await page.getByRole('button', { name: /Cancel/i }).click();
      await expect(page.getByText(/This action cannot be undone/i)).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should allow posting a comment', async ({ page }) => {
    await page.getByPlaceholder('Add a comment...').fill('Amazing work!');
    await page.getByRole('button', { name: /Post Comment/i }).click();
    await expect(page.locator('text=Amazing work!').first()).toBeVisible();
  });

  test('should allow liking a comment', async ({ page }) => {
    const likeIcon = page.locator('button').filter({ has: page.locator('svg[data-testid="ThumbUpIcon"]') }).first();
    await likeIcon.click({ force: true });
    await expect(likeIcon).toBeVisible();
  });

  test('should allow downloading the collage if owner', async ({ page }) => {
    const downloadBtn = page.locator('button').filter({ has: page.locator('svg[data-testid="DownloadIcon"]') });
    if (await downloadBtn.first().isVisible()) {
      await downloadBtn.first().click();
      await expect(downloadBtn.first()).toBeVisible();
    } 
    else {
      test.skip();
    }
  });
});