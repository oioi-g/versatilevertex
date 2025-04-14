import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'oishee.g@somaiya.edu';
const TEST_PASSWORD = '240804';

test.describe('User Design Challenges Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/loginpage');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('**/homepage');
    await page.goto('http://localhost:3000/userdesignchallengespage');
  });

  test('should display design challenges', async ({ page }) => {
    await expect(page.locator('.MuiCard-root', { hasText: /Deadline/ }).first()).toBeVisible();
  });

  test('should show submission form when clicked', async ({ page }) => {
    const firstChallenge = page.locator('.MuiCard-root').first();
    const challengeTitle = await firstChallenge.locator('.MuiTypography-h6').textContent();
    await firstChallenge.click();
    await expect(page.getByRole('heading', { name: `Submit Your Design for: ${challengeTitle}` })).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit/i })).toBeVisible();
  });

  test('should show error when submitting without image', async ({ page }) => {
    await page.locator('.MuiCard-root').first().click();
    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.locator('.MuiAlert-message')).toHaveText('Please select an image to upload.');
  });

  test('should show past deadline message for expired challenges', async ({ page }) => {
    const expiredChallenge = page.locator('.MuiCard-root', { hasText: /Passed/ }).first();
    await expiredChallenge.click();
    await expect(page.locator('.MuiAlert-message')).toHaveText('This challenge has closed. Submissions are no longer accepted.');
  });

  test('should allow deleting submissions', async ({ page }) => {
    const submissionExists = await page.locator('.MuiCard-root', { hasText: /Submitted on:/ }).count() > 0;
    if (submissionExists) {
      const firstSubmission = page.locator('.MuiCard-root', { hasText: /Submitted on:/ }).first();
      await firstSubmission.getByRole('button', { name: /Delete Submission/i }).click();
      await expect(page.locator('.MuiAlert-message')).toHaveText('Submission deleted successfully!');
    } 
    else {
      test.skip();
    }
  });
  
});