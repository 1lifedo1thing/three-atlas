import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('键盘从跳转、搜索、卡片、作品到返回，保留焦点', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Tab');
  await expect(page.locator('.ui-skip')).toBeFocused();
  await page.keyboard.press('Enter');
  const search=page.getByRole('searchbox'); await expect(search).toBeFocused();
  await search.fill('stars');await page.keyboard.press('Tab');
  await expect(page.locator('.ui-card__link')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page).toHaveURL(/experiences\/where-stars-rest/);
  await page.locator('body.ready').waitFor();
  const back=page.locator('.atlas-return');await back.focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);await expect(page.locator('.ui-card__link')).toBeFocused();
});
for(const lang of ['zh','en'])test(`${lang} 首页 AA 自动复核与减少动态降级`,async({page})=>{
  await page.addInitScript(lang=>localStorage.setItem('three-atlas.language',lang),lang);
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);
  const results=await new AxeBuilder({page}).exclude('.ui-principle__index').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await expect(page.locator('.ui-badge__dot').first()).toHaveCSS('animation-iteration-count','1');
});
test.fixme('逐词点亮在未点亮状态仍满足大字 AA（等待设计参数确认）',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  const result=await new AxeBuilder({page}).include('.ui-statement').withRules(['color-contrast']).analyze();
  expect(result.violations.map(v=>v.id)).toEqual([]);
});

test('开窗隐藏时跳过不可见按钮，展开后仍可聚焦',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.ui-window__frame')).toHaveCSS('opacity','1');
 await page.locator('.ui-window').evaluate(el=>scrollTo(0,el.offsetTop));
 await expect(page.locator('.ui-window__caption')).toHaveCSS('opacity','0');
 await page.locator('.ui-nav__lang').focus();await page.keyboard.press('Tab');
 await expect(page.getByRole('searchbox')).toBeFocused();
 await page.locator('.ui-window').evaluate(el=>scrollTo(0,el.offsetTop+innerHeight));
 await expect(page.locator('.ui-window__caption')).toHaveCSS('opacity','1');
 await page.locator('.ui-nav__lang').focus();await page.keyboard.press('Tab');
 await expect(page.locator('.ui-window__actions a').first()).toBeFocused();
});
for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const selector of ['.ui-nav__lang','.ui-footer__legal button'])test(`键盘切换语言保留 ${viewport.width} ${selector} 的可见焦点`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/');await page.locator(selector).focus();await page.keyboard.press('Enter');
 await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator(selector)).toBeFocused();
 const bounds=await page.locator(selector).boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
});
