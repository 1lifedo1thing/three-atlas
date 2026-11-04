import test from 'node:test';
import assert from 'node:assert/strict';
const parallax = await import('../src/ui/parallax.js').catch(() => null);

test('开窗视差在边缘限制为 ±1.2%，每帧追随系数为 0.08', () => {
  assert.ok(parallax?.parallaxTarget, '开窗视差尚未实现');
  const rect = { left: 100, top: 50, width: 100, height: 100 };
  assert.deepEqual(parallax.parallaxTarget(150, 100, rect), { x: 0, y: 0 });
  assert.deepEqual(parallax.parallaxTarget(999, -999, rect), { x: 1.2, y: -1.2 });
  assert.deepEqual(parallax.parallaxStep({ x: 0, y: 0 }, { x: 1.2, y: -1.2 }), { x: 0.096, y: -0.096 });
});
