import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000, // 60 seconds per test
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'https://forge.jalanea.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Desktop Chrome
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile Chrome (iPhone 12 - 390px width)
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  outputDir: 'test-results/',
});
