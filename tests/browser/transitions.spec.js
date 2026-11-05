import { test, expect } from '@playwright/test';

async function instrument(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    addEventListener('pagereveal', event => {
      window.atlasTransition = { present: Boolean(event.viewTransition), ready: false };
      if (!event.viewTransition) return;
      event.viewTransition.ready.then(() => { window.atlasTransition.ready = true; window.atlasTransition.names = [...document.querySelectorAll('.world-image, .atlas-arrival')].filter(el => getComputedStyle(el).viewTransitionName === 'atlas-world').length; }, error => { window.atlasTransition.error = error.message; });
      event.viewTransition.finished.then(() => { window.atlasTransition.finished = true; }, error => { window.atlasTransition.error = error.message; });
    });
  });
  return errors;
}

test('普通动效冷启动进入与返回均真正启动跨页过渡', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors = await instrument(page);
  // Simulate a slow scene module. Opt-in must be available before its JS/CSS imports.
  await page.route('**/experiences/where-stars-rest/src/main.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 300)); await route.continue();
  });
  await page.goto('/'); await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-work-id="where-stars-rest"] .ui-card__link')).toHaveCSS('opacity', '1');
  await page.locator('[data-work-id="where-stars-rest"] .ui-card__link').click(); await page.locator('body.ready').waitFor();
  await expect.poll(() => page.evaluate(() => window.atlasTransition)).toMatchObject({ present: true, ready: true, names: 1 });
  await expect(page.locator('html')).toHaveClass(/atlas-arrived/);
  await expect(page.locator('.atlas-arrival')).toHaveCSS('opacity', '0');
  await page.locator('.atlas-return').click();
  await expect.poll(() => page.evaluate(() => window.atlasTransition)).toMatchObject({ present: true, ready: true, names: 1 });
  await expect(page.locator('[data-work-id="where-stars-rest"] .ui-card__link')).toBeFocused();
  await expect.poll(() => page.locator('.world-image').evaluateAll(els => els.filter(el => el.style.viewTransitionName === 'atlas-world').length)).toBe(0);
  expect(errors).toEqual([]);
});

test('减少动态模式直接跳转，不启动跨页过渡或报告异常', async ({ page }) => {
  const errors = await instrument(page);
  await page.goto('/'); await page.locator('[data-work-id="where-stars-rest"] .ui-card__link').click(); await page.locator('body.ready').waitFor();
  await expect.poll(() => page.evaluate(() => window.atlasTransition?.present)).toBe(false);
  await expect(page.locator('html')).not.toHaveClass(/atlas-arrived/);
  await page.locator('.atlas-return').click(); await expect(page.locator('[data-work-id="where-stars-rest"] .ui-card__link')).toBeFocused();
  expect(errors).toEqual([]);
});

test('缺少 Navigation API 时进入和返回仍可完成转场且没有异常', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => { delete window.navigation; });
  const errors = await instrument(page);
  await page.goto('/'); await page.locator('[data-work-id="where-stars-rest"] .ui-card__link').click();
  await page.locator('body.ready').waitFor();
  await expect(page.locator('html')).toHaveClass(/atlas-arrived/);
  await expect(page.locator('.atlas-arrival')).toHaveCSS('opacity', '0');
  await page.locator('.atlas-return').click();
  await expect(page.locator('[data-work-id="where-stars-rest"] .ui-card__link')).toBeFocused();
  expect(errors).toEqual([]);
});

test('WebGL 初始化失败后错误说明、重试和返回入口不会被封面遮挡', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
  });
  const errors = await instrument(page);
  await page.goto('/'); await page.locator('[data-work-id="where-stars-rest"] .ui-card__link').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('.atlas-arrival')).toBeHidden();
  await expect(page.getByRole('heading', { name: '星海暂时无法抵达' })).toBeVisible();
  await expect(page.getByRole('button', { name: '重新载入' })).toBeVisible();
  const back = page.locator('#error a');
  await expect(back).toBeVisible(); await back.click();
  await expect(page.locator('[data-work-id="where-stars-rest"] .ui-card__link')).toBeFocused();
  expect(errors).toEqual([]);
});
