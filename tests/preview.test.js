import test from 'node:test';
import assert from 'node:assert/strict';

const preview = await import('../src/ui/preview.js').catch(() => null);

test('预览视频只在可见、允许动态效果且网络充足时播放', () => {
  assert.ok(preview?.canPlayPreview, '视频播放策略尚未实现');
  assert.equal(preview.canPlayPreview({ inView: true, pageVisible: true, reducedMotion: false }), true);
  for (const state of [
    { inView: false, pageVisible: true },
    { inView: true, pageVisible: false },
    { inView: true, pageVisible: true, reducedMotion: true },
    ...['slow-2g', '2g', '3g'].map(effectiveType => ({ inView: true, pageVisible: true, connection: { effectiveType } })),
    { inView: true, pageVisible: true, connection: { effectiveType: '4g', saveData: true } },
  ]) assert.equal(preview.canPlayPreview(state), false, JSON.stringify(state));
  assert.equal(preview.canPlayPreview({ inView: true, pageVisible: true, connection: { effectiveType: '4g' } }), true);
});
