import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('亮点卡只有一个活动指针光，移动时不重新读取布局', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('.ui-panel').first();
  await panel.scrollIntoViewIfNeeded();
  const box = await panel.boundingBox();
  await panel.evaluate(el => {
    const original = el.getBoundingClientRect.bind(el);
    el.dataset.rectReads = '0';
    el.getBoundingClientRect = () => { el.dataset.rectReads = String(Number(el.dataset.rectReads) + 1); return original(); };
  });
  await page.mouse.move(box.x + 20, box.y + 30);
  await expect(panel).toHaveClass(/is-pointer-active/);
  await page.mouse.move(box.x + 60, box.y + 80, { steps: 8 });
  await expect.poll(() => panel.evaluate(el => el.style.getPropertyValue('--mx'))).not.toBe('');
  expect(await panel.getAttribute('data-rect-reads')).toBe('1');
  await page.locator('.ui-panel').nth(1).hover();
  await expect(page.locator('.is-pointer-active')).toHaveCount(1);
  await page.mouse.move(5, 5);
  await expect(page.locator('.is-pointer-active')).toHaveCount(0);
});

test('粗指针设备不启用指针光', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5214/');
  await page.locator('.ui-panel').first().scrollIntoViewIfNeeded();
  await page.locator('.ui-panel').first().hover();
  await expect(page.locator('.is-pointer-active')).toHaveCount(0);
  await context.close();
});
