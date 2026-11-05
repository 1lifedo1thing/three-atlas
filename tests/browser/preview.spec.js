import { test, expect } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'no-preference' } });

test('开窗按需播放，离开视口暂停，语言重绘释放旧视频', async ({ page }) => {
  await page.goto('/pages/ui/');
  const video = page.locator('.ui-window__video');
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveJSProperty('muted', true);
  await page.locator('.ui-window__stage').scrollIntoViewIfNeeded();
  await expect(video).toHaveClass(/is-playing/, { timeout: 5000 });
  await expect(video).toHaveJSProperty('paused', false);
  const old = await video.elementHandle();
  await page.locator('#show-index').scrollIntoViewIfNeeded();
  await expect(video).toHaveJSProperty('paused', true);
  await page.locator('.ui-nav__lang').click();
  await expect(page.locator('.ui-window__video')).toHaveCount(1);
  expect(await old.evaluate(el => el.paused && el.querySelectorAll('source').length === 0)).toBe(true);
});

for (const mode of ['reduce', 'save-data', '3g']) {
  test(`${mode} 模式不加载预览视频`, async ({ page }) => {
    const requests = [];
    page.on('request', request => { if (/\.(mp4|webm)(?:\?|$)/.test(request.url())) requests.push(request.url()); });
    if (mode === 'reduce') await page.emulateMedia({ reducedMotion: 'reduce' });
    else await page.addInitScript(value => {
      Object.defineProperty(navigator, 'connection', { configurable: true, value: Object.assign(new EventTarget(), { saveData: value === 'save-data', effectiveType: value === '3g' ? '3g' : '4g' }) });
    }, mode);
    await page.goto('/pages/ui/');
    await expect(page.locator('.ui-window__video')).toHaveCount(1);
    await page.locator('.ui-window__stage').scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await expect(page.locator('.ui-window__video source')).toHaveCount(0);
    expect(requests).toEqual([]);
  });
}
