import { test, expect } from '@playwright/test';
test('三类控件按下缩至 0.97，按下 120ms，释放 240ms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => {
    const bar = document.createElement('div');bar.style.cssText='position:fixed;top:100px;left:100px;z-index:1000';
    for(const cls of ['ui-btn','ui-chip','ui-gallery__paddle']) { const b=document.createElement('button');b.className=cls;b.textContent=cls;bar.append(b); }
    document.body.append(bar);
  });
  for(const cls of ['ui-btn','ui-chip','ui-gallery__paddle']) {
    const control=page.locator(`body>div:last-child .${cls}`);
    await control.hover(); await page.mouse.down();
    await expect(control).toHaveCSS('transform','matrix(0.97, 0, 0, 0.97, 0, 0)');
    expect(await control.evaluate(e=>getComputedStyle(e).transitionDuration.split(',').map(s=>s.trim()))).toContain('0.12s');
    await page.mouse.up();
    expect(await control.evaluate(e=>getComputedStyle(e).transitionDuration.split(',').map(s=>s.trim()))).toContain('0.24s');
    await expect(control).toHaveCSS('transform','none');
  }
});
