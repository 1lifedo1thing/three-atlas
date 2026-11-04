import { test, expect } from '@playwright/test';
test.use({ reducedMotion: 'no-preference' });

test('指针进入开窗产生有限视差，离开后回中，减少动态时停止', async ({ page }) => {
  await page.goto('/');
  const frame = page.locator('.ui-window__frame');
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  await frame.hover({ position: { x: box.width * 0.8, y: box.height * 0.7 } });
  const media = page.locator('.ui-window__media');
  await expect(media).toHaveCount(1);
  await expect.poll(() => media.evaluate(el => Number.parseFloat(el.style.getPropertyValue('--pan-x')))).toBeGreaterThan(0);
  expect(await media.evaluate(el => Math.abs(Number.parseFloat(el.style.getPropertyValue('--pan-x'))))).toBeLessThanOrEqual(1.2);
  await page.mouse.move(1, 1);
  const offset = () => media.evaluate(el => Math.abs(Number.parseFloat(el.style.getPropertyValue('--pan-x'))));
  await expect.poll(offset).toBeLessThan(0.01);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => media.evaluate(el => el.style.getPropertyValue('--pan-x'))).toBe('0%');
});
