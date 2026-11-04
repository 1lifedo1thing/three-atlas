import { test, expect } from '@playwright/test';
test('页脚字标逐字升起，只触发一次；减少动态时直接呈现', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/'); await page.evaluate(()=>document.fonts.ready);
  const chars=page.locator('.ui-footer__char');
  await expect(chars).toHaveCount(10);
  expect(await chars.first().evaluate(async el => (await import('/src/ui/motion.js')).gsap.getProperty(el,'yPercent'))).toBe(60);
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
  await expect.poll(()=>chars.last().evaluate(async el=>(await import('/src/ui/motion.js')).gsap.getProperty(el,'yPercent'))).toBe(0);
  await page.evaluate(()=>scrollTo(0,0)); await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
  expect(await chars.first().evaluate(async el=>(await import('/src/ui/motion.js')).gsap.isTweening(el))).toBe(false);
  await page.emulateMedia({ reducedMotion:'reduce' }); await page.reload();
  await expect(page.locator('.ui-footer__char')).toHaveCount(0);
  await expect(page.locator('.ui-footer__mark')).toHaveText('Three Atlas');
});
