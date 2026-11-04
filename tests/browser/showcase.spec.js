import{test,expect}from'@playwright/test';
test('陈列页包含全部组件与空、悬停、缺图状态，首页不链接',async({page})=>{
 await page.goto('/pages/ui/');await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 for(const selector of ['.ui-nav','.ui-hero','.ui-head','.ui-window','.ui-statement','.ui-panels','.ui-principles','.ui-highlights','.ui-roadmap','.ui-card','.ui-index','.ui-footer','.ui-experience','.ui-showcase'])await expect(page.locator(selector).first()).toBeVisible();
 await expect(page.locator('.ui-card__picture.is-missing')).toHaveCount(1);await expect(page.locator('.ui-index__empty:not([hidden])')).toHaveCount(1);
 for(const variant of ['primary','secondary','ghost'])await expect(page.locator(`.ui-btn--${variant}`).first()).toBeVisible();
 await page.goto('/');await expect(page.locator('a[href*="pages/ui"]')).toHaveCount(0);
});
