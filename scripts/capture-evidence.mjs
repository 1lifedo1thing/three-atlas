// Captures the four requested before/after views in isolated Playwright contexts.
// Motion recordings use a normal-motion context; static comparisons use reduced motion.
import { chromium } from '@playwright/test';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const [item = 'baseline', phase = 'after', target = ''] = process.argv.slice(2);
const base = process.env.ATLAS_REVIEW_URL || 'http://127.0.0.1:5214/';
const root = resolve('output/engineering-review', item, phase);
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.platform === 'darwin' ? { args: ['--use-angle=metal', '--enable-gpu'] } : {}) });
const errors = [];
try {
  for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    for (const lang of ['zh', 'en']) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      await context.addInitScript(value => localStorage.setItem('three-atlas.language', value), lang);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); }));
      });
      await page.screenshot({ path: resolve(root, `${device}-${lang}.jpg`), fullPage: true, type: 'jpeg', quality: 88 });
      await context.close();
    }
  }
  if (phase === 'after') {
    const viewport = { width: 1440, height: 900 };
    const context = await browser.newContext({ viewport, recordVideo: { dir: resolve(root, 'raw'), size: viewport } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    if (target) await page.locator(target).first().scrollIntoViewIfNeeded();
    await page.mouse.move(520, 460);
    await page.mouse.wheel(0, target ? 100 : 600);
    await page.waitForTimeout(900);
    for (const [x, y] of [[650, 430], [820, 380], [1050, 500]]) {
      await page.mouse.move(x, y, { steps: 18 });
      await page.waitForTimeout(500);
    }
    if (!target) { await page.mouse.wheel(0, 1100); await page.waitForTimeout(900); }
    if (item === 'P1-F') {
      const button = page.locator('.ui-footer .ui-btn').first();
      await button.scrollIntoViewIfNeeded();
      await button.hover();
      await page.mouse.down();
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: resolve(root, 'interaction.jpg'), type: 'jpeg', quality: 88 });
    if (item === 'P1-F') { await page.mouse.move(10, 100); await page.mouse.up(); await page.waitForTimeout(300); }
    const video = page.video();
    await context.close();
    const raw = await video.path();
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-t', '10', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(root, 'interaction.mp4')]);
  }
  await writeFile(resolve(root, 'capture.json'), JSON.stringify({ item, phase, base, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), staticMotion: 'reduce', videoMotion: 'normal', errors }, null, 2) + '\n');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`已采集 ${item}/${phase}：桌面、手机 × 中英文${phase === 'after' ? '，附真实交互录屏' : ''}。`);
} finally { await browser.close(); }
