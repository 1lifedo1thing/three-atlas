import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

/** Lab Event Timing sample, not a replacement for field INP. */
export async function measureInteractions() {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4214', '--strictPort'], { stdio: 'ignore' });
  let browser;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { ready = (await fetch('http://127.0.0.1:4214/')).ok; } catch { /* Server starting. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, '性能预览服务未启动');
    browser = await chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu'] : [] });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 1_280_000, uploadThroughput: 1_280_000 });
    await page.addInitScript(() => {
      window.atlasEvents = [];
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (entry.interactionId) window.atlasEvents.push({ target: entry.target?.className, name: entry.name, duration: entry.duration, interactionId: entry.interactionId });
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    });
    await page.goto('http://127.0.0.1:4214/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.keyboard.press('/');
    const search = page.getByRole('searchbox');
    // The shortcut focuses search when its authored scroll completes. Do not race it with Playwright auto-scroll.
    await expect(search).toBeFocused();
    await search.click();
    await page.keyboard.type('stars', { delay: 100 });
    await page.locator('.ui-nav__lang').click();
    await page.waitForTimeout(500);
    const samples = await page.evaluate(() => window.atlasEvents);
    await mkdir('output/performance', { recursive: true });
    await writeFile('output/performance/interaction-samples.json', JSON.stringify(samples, null, 2));
    assert.ok(samples.length, '没有采集到 Event Timing 交互样本');
    const maxDuration = Math.max(...samples.map(sample => sample.duration));
    assert.ok(maxDuration <= 100, `实验室交互时长 ${maxDuration}ms 超出 100ms`);
    return { maxDuration, samples, cpuSlowdown: 4, network: '40ms RTT / 10Mbps', fieldINP: '未测量；本项为实验室 Event Timing，不等同于现场 INP。' };
  } finally { await browser?.close(); server.kill(); }
}
