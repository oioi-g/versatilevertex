import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // or './tests'
  use: {
    baseURL: 'http://localhost:3000/',
    headless: true,
  },
});