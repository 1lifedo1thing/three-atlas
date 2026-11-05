import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const works = JSON.parse(readFileSync(new URL('../../content/works.json', import.meta.url), 'utf8'));
const categoryCount = new Set(works.map(work => work.category.zh)).size;

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  for (const lang of ['zh', 'en']) test(`画廊结构、搜索和布局 ${viewport.width} ${lang}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(lang => localStorage.setItem('three-atlas.language', lang), lang);
    const engines = [];
    page.on('request', r => { if (/three(?:\.module|\.core)?\.js|\/experiences\/.+\/src\//.test(r.url())) engines.push(r.url()); });
    await page.goto('/');
    for (const selector of ['.ui-hero--compact', '.ui-index__bar', '.ui-index__grid', '.ui-card--featured', '.ui-principles--compact', '.ui-footer']) await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.ui-window, .ui-statement, .ui-panels, .ui-roadmap, canvas')).toHaveCount(0);
    await expect(page.locator('.ui-chips')).toHaveCount(categoryCount > 1 ? 1 : 0);
    const box = await page.locator('.ui-card--featured .ui-card__picture').boundingBox();
    expect(box.y).toBeLessThan(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const search = page.getByRole('searchbox');
    await search.fill('不存在的世界'); await expect(page.locator('.ui-card')).toHaveCount(0);
    await expect(page.locator('.ui-index__empty')).toBeVisible();
    await page.locator('.ui-index__empty button').click(); await expect(search).toBeFocused();
    await expect(page.locator('.ui-card')).toHaveCount(works.length);
    await page.keyboard.press('Escape'); await search.blur();
    await page.keyboard.press('/'); await expect(search).toBeFocused();
    await search.fill('three.js'); await expect(page.locator('.ui-card')).toHaveCount(works.length);
    if (categoryCount > 1) {
      await page.locator('.ui-chip').last().click();
      await search.fill('不存在的世界'); await page.locator('.ui-index__empty button').click();
      await expect(page.locator('.ui-chip').first()).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.ui-chip').last()).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('.ui-card')).toHaveCount(works.length);
    }
    expect(engines).toEqual([]);
  });
}
