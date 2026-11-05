import { test, expect } from '@playwright/test';

for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['laptop', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]]) {
  for (const lang of ['zh', 'en']) {
    for (const [surface, path] of [['gallery', '/'], ['showcase', `/pages/ui/?lang=${lang}`]]) test(`${surface}-${device}-${lang}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(lang => localStorage.setItem('three-atlas.language', lang), lang);
      await page.goto(path);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); }));
      });
      await expect(page).toHaveScreenshot(`${surface}-${device}-${lang}.png`, { fullPage: true });
    });
  }
}
