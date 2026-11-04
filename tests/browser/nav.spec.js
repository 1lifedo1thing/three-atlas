import { test, expect } from '@playwright/test';
test('导航跟随视口中线，切换语言后仍唯一定位', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
  for (const id of ['featured', 'about', 'works']) {
    await page.locator(`#${id}`).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2));
    await expect(page.locator('.ui-nav__link[aria-current="true"]')).toHaveAttribute('href', `#${id}`);
  }
  await page.locator('.ui-nav__lang').click();
  await expect(page.locator('.ui-nav__link[aria-current="true"]')).toHaveAttribute('href', '#works');
  await expect(page.locator('.ui-nav__indicator')).toHaveCSS('width', '4px');
  await page.evaluate(() => scrollTo(0,0));
  await expect(page.locator('.ui-nav__link[aria-current="true"]')).toHaveCount(0);
});

test('普通动效的开窗 pin 不影响区块中线定位', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
  for (const id of ['featured', 'about', 'works']) {
    await page.locator(`#${id}`).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2));
    await expect(page.locator('.ui-nav__link[aria-current="true"]')).toHaveAttribute('href', `#${id}`);
  }
});
