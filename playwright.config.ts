import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 3,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: '**/touch.spec.ts' },
    { name: 'WebKit', use: { ...devices['Desktop Safari'] }, testIgnore: ['**/touch.spec.ts', '**/gestures.spec.ts'] },
    { name: 'iPad WebKit', use: { ...devices['iPad Mini'], defaultBrowserType: 'webkit' }, testMatch: '**/touch.spec.ts' },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI,
  },
});
