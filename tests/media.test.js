import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const media = await import('../scripts/media.mjs').catch(() => null);

test('占位色由真实像素平均值自动计算，不能手填固定颜色', async () => {
  assert.ok(media?.imageTone, '自动占位色尚未实现');
  const pixels = Buffer.from([20, 40, 60, 60, 80, 100]);
  const image = await sharp(pixels, { raw: { width: 2, height: 1, channels: 3 } }).png().toBuffer();
  assert.equal(await media.imageTone(image), '#283c50');
});
