import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { measureInteractions } from './perf-interactions.mjs';

const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
const visited = new Set();
let gzipBytes = 0;
async function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  gzipBytes += gzipSync(await readFile(`dist/${chunk.file}`)).length;
  for (const imported of [...chunk.imports ?? [], ...chunk.dynamicImports ?? []]) await visit(imported);
}
await visit('index.html');
console.log(`首页 JavaScript gzip：${gzipBytes} / 70000 字节`);
assert.ok(gzipBytes <= 70_000, '首页 JavaScript 超出 70 KB gzip');
for (const command of ['collect', 'assert']) {
  const result = spawnSync(process.execPath, ['node_modules/@lhci/cli/src/cli.js', command, '--config=lighthouserc.cjs'], { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromium.executablePath() } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
await mkdir('output/performance', { recursive: true });
const interactions = await measureInteractions();
await writeFile('output/performance/interactions.json', JSON.stringify(interactions, null, 2));
console.log(`实验室 Event Timing 最长交互：${interactions.maxDuration} / 100 ms（不代表现场 INP）`);
await writeFile('output/performance/budget.json', JSON.stringify({ gzipBytes, limit: 70000, profile: 'Mobile / Fast 4G: 40ms RTT, 10Mbps, 4x CPU', fieldINP: '未测量：真实 INP 需要现场数据；另测实验室 Event Timing 交互时长。' }, null, 2));
console.log('Lighthouse CI 预算通过；报告保存在 .lighthouseci/，没有上传。');
