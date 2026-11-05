import { defineConfig } from '@playwright/test';
import browserConfig from './playwright.config.js';

export default defineConfig({
  ...browserConfig,
  testMatch: ['transitions.spec.js', 'work-locale.spec.js'],
  outputDir: './output/production-tests',
  use: { ...browserConfig.use, baseURL: 'http://127.0.0.1:4214' },
  webServer: { command: 'npm run preview -- --port 4214', url: 'http://127.0.0.1:4214/', reuseExistingServer: !process.env.CI },
});
