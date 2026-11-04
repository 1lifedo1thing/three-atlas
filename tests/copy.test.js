import test from 'node:test';
import assert from 'node:assert/strict';

const scanner = await import('../scripts/check-copy.mjs').catch(() => null);

test('文风检查指出文件、嵌套字段及中文禁用词', () => {
  assert.ok(scanner?.scanCopy, '文风检查器尚未实现');
  const errors = scanner.scanCopy({ zh: { about: [{ text: '这是一项震撼的新技术。' }] } }, 'src/gallery/copy.js');
  assert.deepEqual(errors, [{ file: 'src/gallery/copy.js', field: 'zh.about[0].text', reason: '包含禁用词「震撼」' }]);
});

test('中英文感叹号与动态文案中的禁用词都被拒绝', () => {
  assert.ok(scanner?.scanCopy, '文风检查器尚未实现');
  for (const value of ['你好！', 'Hello!', '极致', '颠覆', '史诗级', '炸裂', '黑科技', n => n === 1 ? '震撼' : `${n} 个作品`]) {
    assert.ok(scanner.scanCopy({ title: value }, 'fixture.js').length > 0);
  }
});

test('正常的技术说明与动态数量文案通过检查', () => {
  assert.ok(scanner?.scanCopy, '文风检查器尚未实现');
  assert.deepEqual(scanner.scanCopy({ title: '13,500 片实例化树叶', en: 'Light that breathes.', count: n => `${n} 个作品` }, 'fixture.js'), []);
});
