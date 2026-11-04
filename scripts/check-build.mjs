import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const works = JSON.parse(readFileSync(resolve(root, 'content/works.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'dist/.vite/manifest.json'), 'utf8'));
for (const work of works) {
  assert.ok(existsSync(resolve(root, 'dist', work.entry)), `缺少作品页面：${work.id}`);
  assert.ok(existsSync(resolve(root, 'dist', work.cover)), `缺少作品封面：${work.id}`);
  assert.ok(manifest[work.entry]?.isEntry, `作品未成为构建入口：${work.id}`);
  const html = readFileSync(resolve(root, 'dist', work.entry), 'utf8');
  assert.ok(html.includes('href="../../"'), `缺少返回图鉴的相对链接：${work.id}`);
}
const visited = new Set();
function dependencies(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  assert.ok(chunk, `找不到构建模块：${key}`);
  assert.ok(!/(?:^|\/)three-[^/]+\.js$/.test(chunk.file), '首页不应加载 Three.js');
  for (const imported of [...(chunk.imports ?? []), ...(chunk.dynamicImports ?? [])]) dependencies(imported);
}
dependencies('index.html');
console.log(`构建检查通过：${works.length} 个独立页面，首页不加载 Three.js。`);
