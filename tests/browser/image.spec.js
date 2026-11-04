import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('图片下载与解码完成前保持占位，完成后显示', async ({ page }) => {
  const body = await readFile('public/media/where-stars-rest.jpg');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/media/where-stars-rest.jpg', async route => { await gate; await route.fulfill({ body, contentType: 'image/jpeg' }); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const image = page.locator('.ui-window__image');
  try {
    await expect(image).toHaveClass(/ui-image/);
    await expect(image).toHaveCSS('opacity', '0');
  } finally { release(); }
  await expect(image).toHaveClass(/is-ready/);
  await expect(image).toHaveCSS('opacity', '1');
});

test('缺图保留卡片占位且不会产生未处理的解码异常', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/media/where-stars-rest.jpg', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.ui-card__picture')).toHaveClass(/is-missing/);
  expect(errors).toEqual([]);
});
