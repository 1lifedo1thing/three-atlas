import test from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../scripts/vite/atlas-meta.mjs').catch(() => null);
const work = { id: 'first', entry: 'experiences/first/index.html', title: 'Stars & "Silence"', summary: { zh: '静静看星光。', en: 'Watch the stars.' }, cover: 'media/stars.jpg', coverAlt: { zh: '星光与岛屿', en: 'Stars and an island' }, images: { width: 2880, height: 1800 } };
const html = '<html><head><title>Three Atlas · 三维图鉴</title><meta name="description" content="走进三维世界。"></head><body></body></html>';
function transform(siteURL, path) {
  assert.ok(module?.atlasMeta, '分享元数据构建插件尚未实现');
  return module.atlasMeta([work], { siteURL }).transformIndexHtml.handler(html, { path });
}

test('分享元数据使用正式站点和子路径的绝对 URL', () => {
  const home = transform('https://example.com/atlas', '/index.html');
  for (const fragment of ['property="og:url" content="https://example.com/atlas/"', 'property="og:image" content="https://example.com/atlas/media/stars.jpg"', 'name="twitter:card" content="summary_large_image"', 'rel="canonical" href="https://example.com/atlas/"']) assert.ok(home.includes(fragment), fragment);
  const page = transform('https://example.com/atlas/', '/experiences/first/index.html');
  assert.ok(page.includes('property="og:url" content="https://example.com/atlas/experiences/first/index.html"'));
  assert.ok(page.includes('property="og:description" content="静静看星光。"'));
  assert.ok(page.includes('property="og:image:width" content="2880"'));
  assert.ok(page.includes('Stars &amp; &quot;Silence&quot;'));
});

test('分享构建拒绝非 HTTP 地址和包含凭据、查询或锚点的地址', () => {
  assert.ok(module?.atlasMeta, '分享元数据构建插件尚未实现');
  for (const siteURL of ['javascript:alert(1)', 'https://user:pass@example.com/', 'https://example.com/?token=x', 'https://example.com/#a', 'invalid']) assert.throws(() => module.atlasMeta([work], { siteURL }), /SITE_URL/);
});

test('默认分享地址使用项目目标，内部陈列页不增加分享元数据', () => {
  assert.ok(transform(undefined, '/').includes('https://guanmo-ai.github.io/three-atlas/'));
  assert.equal(transform('https://example.com/', '/pages/ui/index.html'), html);
});
