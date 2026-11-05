import test from 'node:test';
import assert from 'node:assert/strict';
import { copy } from '../src/copy.js';
import { scanCopy } from '../../../scripts/check-copy.mjs';

const shape = value => typeof value === 'function' ? 'function' : Array.isArray(value) ? `array:${value.length}` : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value;

test('中英文文案字段一一对应', () => {
  assert.deepEqual(shape(copy.en), shape(copy.zh));
  for (const lang of ['zh', 'en']) assert.equal(copy[lang].lands.length, 4);
});

test('文案没有感叹号或禁用词', () => {
  assert.deepEqual(scanCopy(copy, 'experiences/endless-vale/src/copy.js'), []);
});

test('地貌提示按语言组织', () => {
  assert.equal(copy.zh.entering(copy.zh.lands[1]), '进入粉雾花坡');
  assert.equal(copy.en.entering(copy.en.lands[3]), 'Entering frost highlands');
});
