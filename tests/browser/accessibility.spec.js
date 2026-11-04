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
