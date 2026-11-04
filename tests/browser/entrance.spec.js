import { test, expect } from '@playwright/test';
test('首次入场，刷新、换语言与作品返回不重复', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(()=>sessionStorage.getItem('three-atlas.entrance'))).toBe('seen');
  await expect(page.locator('.ui-hero__title div')).not.toHaveCount(0);
  await page.reload();
  await expect(page.locator('.ui-hero__title div')).toHaveCount(0);
  await expect(page.locator('.ui-hero__lede')).toHaveCSS('opacity','1');
  await page.locator('.ui-nav__lang').click();
  await expect(page.locator('.ui-hero__title div')).toHaveCount(0);
  await page.goto('/experiences/where-stars-rest/index.html');
  await page.goBack();
  await expect(page.locator('.ui-hero__title div')).toHaveCount(0);
});
