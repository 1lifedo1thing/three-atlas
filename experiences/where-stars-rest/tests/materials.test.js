import test from 'node:test';
import assert from 'node:assert/strict';
import { windMaterial } from '../src/materials.js';

test('树叶和草叶使用独立着色器缓存，保留树叶彩色发光', () => {
  const time = { value: 0 };
  const grass = windMaterial({ time });
  const leaf = windMaterial({ time, leaf: true, emissive: '#ffffff', intensity: 1 });
  try {
    assert.notEqual(leaf.customProgramCacheKey(), grass.customProgramCacheKey());
  } finally {
    grass.dispose(); leaf.dispose();
  }
});
