import { defineConfig } from '@playwright/test';
import browserConfig from './playwright.config.js';
export default defineConfig({
 ...browserConfig,testDir:'./tests/visual',outputDir:'./output/visual-tests',
 snapshotPathTemplate:'{testDir}/baselines/{arg}{ext}',
 expect:{toHaveScreenshot:{maxDiffPixelRatio:0.005,animations:'disabled',caret:'hide'}},
});
