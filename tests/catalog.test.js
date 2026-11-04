import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectWorks } from '../src/gallery/model.js';
import { buildInputs, validateWorks } from '../scripts/content.mjs';

const works = JSON.parse(readFileSync(new URL('../content/works.json', import.meta.url), 'utf8'));
const root = new URL('../', import.meta.url).pathname;

test('首作及未来多个作品使用中英文标题、简介和标签搜索', () => {
  const second = { ...works[0], id: 'other-world', title: 'MOON LAB', tags: ['physics'] };
  assert.equal(selectWorks(works, '星光')[0].id, 'where-stars-rest');
  assert.equal(selectWorks(works, '  THREE.JS  ').length, 1);
  assert.equal(selectWorks(works, 'island')[0].id, 'where-stars-rest');
  assert.equal(selectWorks(works, '不存在的作品').length, 0);
  assert.equal(selectWorks([...works, second], '').length, 2);
  assert.equal(selectWorks([...works, second], 'moon')[0].id, 'other-world');
});

test('新增目录项自动生成独立构建入口', () => {
  const second = { ...works[0], id: 'moon-lab', entry: 'experiences/moon-lab/index.html' };
  const inputs = buildInputs([...works, second], root);
  assert.equal(Object.keys(inputs).length, 3);
  assert.ok(inputs['moon-lab'].endsWith('/experiences/moon-lab/index.html'));
  assert.ok(inputs.gallery.endsWith('/index.html'));
});

test('目录检查拒绝重复 ID、缺失入口与缺失封面', () => {
  assert.deepEqual(validateWorks(works, root), []);
  assert.ok(validateWorks([...works, works[0]], root).some(error => error.includes('重复')));
  assert.ok(validateWorks([{ ...works[0], entry: 'experiences/missing/index.html' }], root).some(error => error.includes('入口')));
  assert.ok(validateWorks([{ ...works[0], cover: 'media/missing.jpg' }], root).some(error => error.includes('封面')));
});

test('目录检查拒绝外部、越界和带查询串的本地路径', () => {
  for (const entry of ['../../private/index.html', '/experiences/test/index.html', 'https://example.com/index.html', 'experiences/../private/index.html', 'experiences/x/index.html?q=1']) {
    assert.ok(validateWorks([{ ...works[0], entry }], root).length > 0, entry);
  }
  assert.ok(validateWorks([{ ...works[0], cover: '../../secret.jpg' }], root).length > 0);
});
