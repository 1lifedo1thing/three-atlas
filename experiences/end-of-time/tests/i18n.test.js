import test from 'node:test';
import assert from 'node:assert/strict';
import { copy } from '../src/copy.js';
import { ERAS } from '../src/physics.js';
import { scanCopy } from '../../../scripts/check-copy.mjs';

const shape = value => typeof value === 'function' ? 'function' : Array.isArray(value) ? `array:${value.length}` : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value;

test('中英文文案字段一一对应', () => {
  assert.deepEqual(shape(copy.en), shape(copy.zh));
  for (const lang of ['zh', 'en']) {
    assert.deepEqual(Object.keys(copy[lang].eras).sort(), ERAS.map(era => era.key).sort());
    assert.equal(copy[lang].phrases.length, 18);
  }
});

test('文案没有感叹号或禁用词', () => {
  assert.deepEqual(scanCopy(copy, 'experiences/end-of-time/src/copy.js'), []);
});

test('宇宙轮回编号', () => {
  assert.equal(copy.zh.aeon(1), 'AEON I · 第一个宇宙');
  assert.equal(copy.zh.aeon(4), 'AEON IV · 第四个宇宙');
  assert.equal(copy.en.aeon(3), 'AEON III');
});
