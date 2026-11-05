import { test, expect } from '@playwright/test';

for (const lang of ['zh', 'en']) test(`${lang} 作品沿用首页语言，动态控制和刷新保留语言`, async ({ page }) => {
  const en = lang === 'en';
  await page.addInitScript(lang => localStorage.setItem('three-atlas.language', lang), lang);
  await page.goto('/'); await page.locator('[data-work-id="where-stars-rest"] .ui-card__link').click(); await page.locator('body.ready').waitFor();
  await expect(page.locator('html')).toHaveAttribute('lang', en ? 'en' : 'zh-CN');
  await expect(page.locator('#glow')).toHaveAccessibleName(en ? 'Glow brightness' : '光芒亮度');
  await expect(page.locator('#scene')).toHaveAttribute('aria-label', en ? /Drag or use the arrow keys/ : /拖动或使用方向键/);
  await expect(page.locator('#motion')).toHaveAccessibleName(en ? 'Resume automatic rotation' : '继续自动旋转');
  await page.locator('#motion').click();
  await expect(page.locator('#motion')).toHaveAccessibleName(en ? 'Pause automatic rotation' : '暂停自动旋转');
  await page.locator('#reset').click();
  await expect(page.locator('#toast')).toHaveText(en ? 'Back to the first view of the stars' : '已回到最初的星海');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAccessibleName(en ? 'Turn off ambient sound' : '关闭氛围音');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAccessibleName(en ? 'Turn on ambient sound' : '开启氛围音');
  await page.reload(); await page.locator('body.ready').waitFor();
  await expect(page.locator('html')).toHaveAttribute('lang', en ? 'en' : 'zh-CN');
  await expect(page.locator('.atlas-return')).toHaveAccessibleName(en ? 'Back to Three Atlas' : '返回 Three Atlas');
});

test('英文作品的初始化错误、重试与返回也使用英文', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('three-atlas.language', 'en');
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  await page.goto('/experiences/where-stars-rest/index.html');
  await expect(page.getByRole('heading', { name: 'The stars are out of reach for now' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  await expect(page.locator('#error a')).toHaveAccessibleName('Back to Three Atlas');
  await expect(page.locator('#error-message')).toContainText('WebGL 2');
});
