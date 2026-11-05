import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) test(`跨引擎正常导航、英文操作与刷新 ${viewport.width}`, async ({ page }, testInfo) => {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => localStorage.setItem('three-atlas.language', 'en'));
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('searchbox').fill('nothing-to-find');
  await expect(page.locator('.ui-index__empty')).toBeVisible();
  await page.locator('.ui-index__empty button').click();
  await page.locator('[data-work-id="where-stars-rest"] .ui-card__link').click();
  await page.locator('body.ready').waitFor();
  await expect(page.locator('#glow')).toHaveAccessibleName('Glow brightness');
  await page.locator('#glow').fill('74');
  await page.locator('#reset').click();
  await expect(page.locator('#toast')).toHaveText('Back to the first view of the stars');
  await page.reload(); await page.locator('body.ready').waitFor();
  await expect(page.locator('#glow')).toHaveValue('74');
  await page.screenshot({ path: testInfo.outputPath('work.png') });
  await page.locator('.atlas-return').click();
  await expect(page.locator('[data-work-id="where-stars-rest"] .ui-card__link')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  expect(errors).toEqual([]);
});
