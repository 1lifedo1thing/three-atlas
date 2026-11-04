import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function buildInputs(works, root) {
  return Object.fromEntries([
    ['gallery', resolve(root, 'index.html')],
    ...works.map(work => [work.id, resolve(root, work.entry)]),
  ]);
}

export function validateWorks(works, root) {
  const errors = [], ids = new Set();
  if (!Array.isArray(works)) return ['作品目录必须为数组'];
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const bilingual = value => value && text(value.zh) && text(value.en);
  const file = path => existsSync(path) && statSync(path).isFile();
  for (const [index, work] of works.entries()) {
    if (!work || typeof work !== 'object') { errors.push(`第 ${index + 1} 项不是作品对象`); continue; }
    const label = work.id || `第 ${index + 1} 项`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(work.id ?? '') || work.id === 'gallery') errors.push(`${label}：ID 无效或为保留名称`);
    if (ids.has(work.id)) errors.push(`${label}：ID 重复`);
    ids.add(work.id);
    if (!text(work.title) || !bilingual(work.subtitle) || !bilingual(work.summary) || !bilingual(work.category) || !bilingual(work.coverAlt)) errors.push(`${label}：缺少标题或中英文内容`);
    if (!Array.isArray(work.tags) || !work.tags.every(text)) errors.push(`${label}：标签必须为文字数组`);
    if (!text(work.author?.name) || !text(work.author?.handle)) errors.push(`${label}：缺少作者署名`);
    if (work.entry !== `experiences/${work.id}/index.html` || !/^[a-z0-9/-]+\.html$/.test(work.entry)) {
      errors.push(`${label}：入口必须为独立目录 experiences/<id>/index.html`);
    } else if (!file(resolve(root, work.entry))) errors.push(`${label}：入口文件不存在`);
    if (typeof work.cover !== 'string' || !/^media\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(work.cover)) {
      errors.push(`${label}：封面必须位于 public/media/，且不能包含越界路径或查询串`);
    } else if (!file(resolve(root, 'public', work.cover))) errors.push(`${label}：封面文件不存在`);
  }
  return errors;
}
