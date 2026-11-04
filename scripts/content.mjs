import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function buildInputs(works, root) {
  return Object.fromEntries([
    ['gallery', resolve(root, 'index.html')],
    ...works.map(work => [work.id, resolve(root, work.entry)]),
  ]);
}

export function validateWorks(works, root, { requireGenerated = true } = {}) {
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
    if (work.featured !== undefined && typeof work.featured !== 'boolean') errors.push(`${label}：featured 必须为 true 或 false`);
    if (work.preview !== undefined) {
      if (typeof work.preview !== 'string' || !/^media\/[a-zA-Z0-9_-]+$/.test(work.preview)) errors.push(`${label}：preview 必须为 media/ 下的本地文件前缀`);
      else for (const size of [1920, 960]) for (const extension of ['mp4', 'webm']) {
        if (!file(resolve(root, 'public', `${work.preview}-${size}.${extension}`))) errors.push(`${label}：preview 缺少 ${size}.${extension}`);
      }
    }
    if (work.tone !== undefined && !/^#[0-9a-fA-F]{6}$/.test(work.tone)) errors.push(`${label}：tone 必须为六位十六进制颜色`);
    if (work.images !== undefined) {
      const images = work.images;
      if (!(images?.width >= 2880 && images?.height > 0) || !/^[a-f0-9]{64}$/.test(images?.sourceHash ?? '')) errors.push(`${label}：images 缺少高清尺寸或源文件摘要`);
      for (const format of ['avif', 'webp']) {
        if (!Array.isArray(images?.[format]) || images[format].length !== 3) { errors.push(`${label}：images.${format} 必须为三个尺寸`); continue; }
        images[format].forEach((image, index) => {
          if (image.width !== [720, 1440, 2880][index] || typeof image.src !== 'string' || !new RegExp(`^media/[a-zA-Z0-9/_-]+\\.${format}$`).test(image.src) || (requireGenerated && !file(resolve(root, 'public', image.src)))) errors.push(`${label}：images.${format} 路径或宽度无效`);
        });
      }
      if (typeof images?.ambient !== 'string' || !/^media\/[a-zA-Z0-9/_-]+-ambient\.webp$/.test(images.ambient) || (requireGenerated && !file(resolve(root, 'public', images.ambient)))) errors.push(`${label}：images.ambient 路径无效`);
    }
    if (work.highlights !== undefined) {
      if (!Array.isArray(work.highlights)) errors.push(`${label}：highlights 必须为数组`);
      else {
        if (work.highlights.length < 3 || work.highlights.length > 4) errors.push(`${label}：highlights 必须为 3–4 项`);
        work.highlights.forEach((item, i) => {
        if (!bilingual(item?.title) || !bilingual(item?.text)) errors.push(`${label}：第 ${i + 1} 个亮点缺少中英文标题或说明`);
        if (!bilingual(item?.tech)) errors.push(`${label}：第 ${i + 1} 个亮点缺少中英文技术说明`);
        if (item?.focus !== undefined && !/^\d{1,3}% \d{1,3}%$/.test(item.focus)) errors.push(`${label}：第 ${i + 1} 个亮点 focus 应形如 "50% 40%"`);
        if (item?.zoom !== undefined && !(typeof item.zoom === 'number' && item.zoom >= 1 && item.zoom <= 4)) errors.push(`${label}：第 ${i + 1} 个亮点 zoom 应在 1–4 之间`);
        });
      }
    }
    if (typeof work.cover !== 'string' || !/^media\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(work.cover)) {
      errors.push(`${label}：封面必须位于 public/media/，且不能包含越界路径或查询串`);
    } else if (!file(resolve(root, 'public', work.cover))) errors.push(`${label}：封面文件不存在`);
  }
  if (Array.isArray(works) && works.filter(work => work?.featured === true).length > 1) errors.push('最多只能有一个作品设为 featured');
  return errors;
}
