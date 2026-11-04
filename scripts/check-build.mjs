import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const works = JSON.parse(readFileSync(resolve(root, 'content/works.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'dist/.vite/manifest.json'), 'utf8'));
for (const work of works) {
  assert.ok(existsSync(resolve(root, 'dist', work.entry)), `缺少作品页面：${work.id}`);
  assert.ok(existsSync(resolve(root, 'dist', work.cover)), `缺少作品封面：${work.id}`);
  assert.ok(manifest[work.entry]?.isEntry, `作品未成为构建入口：${work.id}`);
  if (work.images) for (const path of [...work.images.avif, ...work.images.webp].map(image => image.src).concat(work.images.ambient)) assert.ok(existsSync(resolve(root, 'dist', path)), `缺少响应式图片：${path}`);
  if (work.preview) for (const size of [1920, 960]) for (const extension of ['mp4', 'webm']) {
    const path = resolve(root, 'dist', `${work.preview}-${size}.${extension}`);
    assert.ok(existsSync(path), `缺少视频预览：${work.id} ${size}.${extension}`);
    assert.ok(statSync(path).size <= (size === 1920 ? 4_000_000 : 1_200_000), `视频预览超出体积预算：${work.id} ${size}.${extension}`);
  }
  const html = readFileSync(resolve(root, 'dist', work.entry), 'utf8');
  assert.ok(html.includes('href="../../"'), `缺少返回图鉴的相对链接：${work.id}`);
  assert.ok(html.includes(`class="atlas-arrival" data-src="${work.cover}"`) && html.includes('data-atlas-arrival'), `作品页缺少进入过渡层：${work.id}`);
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
