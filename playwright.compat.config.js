import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'compatibility.spec.js',
  outputDir: './output/compatibility-tests',
  timeout: 45_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4214', viewport: { width: 1440, height: 900 }, headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'webkit', use: { browserName: 'webkit' } }, { name: 'firefox', use: { browserName: 'firefox' } }],
  webServer: { command: 'npm run preview -- --port 4214', url: 'http://127.0.0.1:4214/', reuseExistingServer: !process.env.CI },
});
