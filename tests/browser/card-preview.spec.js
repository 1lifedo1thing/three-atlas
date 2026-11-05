import { test, expect } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'no-preference' } });

// A real WorkIndex with extra test-only cards.
async function cards(page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const { WorkIndex } = await import('/src/ui/components/work-index.js');
    const { copy } = await import('/src/gallery/copy.js');
    const { default: works } = await import('/content/works.json');
    const source = works[0];
    const work = { ...source, alt: source.coverAlt.zh, subtitle: source.subtitle.zh, category: source.category.zh, summary: source.summary.zh };
    document.querySelector('#works').replaceWith(WorkIndex({ id: 'preview-fixture', labels: copy.zh, select: query => [
      { ...work, id: 'featured', featured: true, index: 0 },
      { ...work, id: 'regular', title: 'MOON LAB', featured: false, index: 1 },
      { ...work, id: 'still', title: 'QUIET FIELD', featured: false, preview: undefined, index: 2 },
    ].filter(work => !query || work.title.toLowerCase().includes(query.toLowerCase())) }));
  });
  return { featured: page.locator('[data-work-id="featured"] video'), regular: page.locator('[data-work-id="regular"] video'), link: page.locator('[data-work-id="regular"] a') };
}

test('普通卡片停留 120ms 加载，暂停主推，离开 300ms 复位并恢复主推', async ({ page }) => {
  const { featured, regular, link } = await cards(page);
  await expect(featured).toHaveJSProperty('paused', false);
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await link.dispatchEvent('pointerenter');
  await page.clock.runFor(119);
  await expect(regular.locator('source')).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(regular).toHaveClass(/is-playing/);
  await expect(featured).toHaveJSProperty('paused', true);
  await expect(regular).toHaveCSS('transition-duration', '0.4s, 1.4s');
  await regular.evaluate(el => { el.currentTime = 1; });
  await link.dispatchEvent('pointerleave');
  await expect(regular).toHaveJSProperty('paused', true);
  await page.clock.runFor(299);
  expect(await regular.evaluate(el => el.currentTime)).toBeGreaterThan(0);
  await page.clock.runFor(1);
  await expect(regular).toHaveJSProperty('currentTime', 0);
  await expect(featured).toHaveJSProperty('paused', false);
  await expect(page.locator('[data-work-id="still"] video')).toHaveCount(0);
});

test('扫过不加载，键盘焦点可播放，离屏及后台暂停', async ({ page }) => {
  const { regular, link } = await cards(page);
  await link.dispatchEvent('pointerenter');
  await link.dispatchEvent('pointerleave');
  await page.waitForTimeout(160);
  await expect(regular.locator('source')).toHaveCount(0);
  await link.focus();
  await expect(regular).toHaveClass(/is-playing/);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(regular).toHaveJSProperty('paused', true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(regular).toHaveJSProperty('paused', false);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(regular).toHaveJSProperty('paused', true);
});

for (const mode of ['reduce', 'save-data', 'slow-2g', '2g', '3g', 'touch']) test(`${mode} 普通卡不加载视频`, async ({ page }) => {
  if (mode === 'reduce') await page.emulateMedia({ reducedMotion: 'reduce' });
  else if (mode === 'touch') await page.addInitScript(() => {
    const original = matchMedia;
    window.matchMedia = query => query.includes('(hover: hover)') ? Object.assign(new EventTarget(), { matches: false }) : original(query);
  });
  else await page.addInitScript(mode => Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: mode === 'save-data', effectiveType: mode === 'save-data' ? '4g' : mode }) }), mode);
  const { regular, link } = await cards(page);
  await link.focus(); await link.dispatchEvent('pointerenter');
  await page.waitForTimeout(160);
  await expect(regular.locator('source')).toHaveCount(0);
});

test('主推卡至少一半可见才自动播放，移除普通卡后释放旧源', async ({ page }) => {
  const { featured, regular, link } = await cards(page);
  await expect(featured).toHaveJSProperty('paused', false);
  await featured.locator('..').locator('..').locator('..').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight * 0.75));
  await expect(featured).toHaveJSProperty('paused', true);
  await link.scrollIntoViewIfNeeded(); await link.focus();
  await expect(regular).toHaveClass(/is-playing/);
  const old = await regular.elementHandle();
  await page.getByRole('searchbox').fill('stars');
  expect(await old.evaluate(el => el.paused && el.querySelectorAll('source').length === 0)).toBe(true);
});

test('搜索保留仍匹配的卡片与视频，连续输入不会重新加载预览', async ({ page }) => {
  await page.goto('/');
  const video = page.locator('[data-work-id="where-stars-rest"] video');
  await expect(video).toHaveClass(/is-playing/);
  const original = await video.elementHandle();
  await original.evaluate(el => { el.dataset.reloads = '0'; el.addEventListener('loadstart', () => { el.dataset.reloads = String(Number(el.dataset.reloads) + 1); }); });
  const search = page.getByRole('searchbox');
  for (const query of ['s', 'st', 'stars']) {
    await search.fill(query);
    expect(await original.evaluate(el => el.isConnected)).toBe(true);
    await expect(video).toHaveJSProperty('paused', false);
    await expect(video.locator('source')).toHaveCount(2);
  }
  expect(await original.getAttribute('data-reloads')).toBe('0');
});
