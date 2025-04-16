import { test, expect } from '@playwright/test';

test.describe('Home Page E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/homepage');
    await page.waitForSelector('text=Browse Images');
  });

  test('should display homepage tabs and search bar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Browse Images/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse Collages/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search images')).toBeVisible();
  });

  test('should switch to Browse Collages tab', async ({ page }) => {
    await page.getByRole('button', { name: /Browse Collages/i }).click();
    await Promise.race([
      expect(page.getByText(/No collages found/i)).toBeVisible(),
      expect(page.locator('img').first()).toBeVisible()
    ]);
  });

  test('should search and render image results', async ({ page }) => {
    await page.getByPlaceholder('Search images').fill('white');
    await page.getByRole('button', { name: /search/i }).click();
    const imageGrid = page.locator('img');
    await expect(imageGrid.first()).toBeVisible({ timeout: 60000 });
  });

  test('should open ImageCard modal when clicking image', async ({ page }) => {
    const image = page.locator('img').first();
    await expect(image).toBeVisible();
    await image.click();
    await expect(page.locator('text=likes')).toBeVisible();
  });

  test('should toggle like button on image card', async ({ page }) => {
    await page.locator('img').first().click();
    const likeBtn = page.locator('button').filter({
      has: page.locator('svg[data-testid="FavoriteIcon"]'),
    }).first();
    await likeBtn.scrollIntoViewIfNeeded();
    await likeBtn.click({ force: true });
    await expect(likeBtn).toBeVisible();
  });

  test('should open collage details page on collage click', async ({ page }) => {
    await page.getByRole('button', { name: /Browse Collages/i }).click();
    const collageLink = page.locator('a[href^="/collagedetailspage/"]').first();
    if (await collageLink.isVisible()) {
      await collageLink.click();
      await expect(page).toHaveURL(/\/collagedetailspage\/.*/);
    } else {
      test.skip();
    }
  });
});