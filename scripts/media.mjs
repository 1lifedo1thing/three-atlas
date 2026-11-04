import sharp from 'sharp';
import { copyDecoders } from './vendor.mjs';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname, basename, extname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateWorks } from './content.mjs';

export async function imageTone(input) {
  const { channels } = await sharp(input).toColourspace('srgb').removeAlpha().stats();
  return `#${channels.slice(0, 3).map(channel => Math.round(channel.mean).toString(16).padStart(2, '0')).join('')}`;
}

export async function generateResponsive(input, { output, base }) {
  if (!/^[a-zA-Z0-9_-]+$/.test(base)) throw new Error('无效图片文件名前缀');
  const metadata = await sharp(input).metadata();
  if (metadata.width < 2880) throw new Error('高清封面宽度至少 2880px，不放大低清图片冒充高清。');
  await mkdir(output, { recursive: true });
  const result = { width: metadata.width, height: metadata.height, avif: [], webp: [], ambient: `${base}-ambient.webp` };
  await Promise.all(['avif', 'webp'].flatMap(format => [720, 1440, 2880].map(async width => {
    const src = `${base}-${width}.${format}`;
    const image = sharp(input).toColourspace('srgb').resize({ width });
    await (format === 'avif' ? image.avif({ quality: 60, effort: 4 }) : image.webp({ quality: 85 })).toFile(resolve(output, src));
    result[format].push({ src, width });
  })));
  result.avif.sort((a, b) => a.width - b.width); result.webp.sort((a, b) => a.width - b.width);
  await sharp(input).resize({ width: 160 }).webp({ quality: 60 }).toFile(resolve(output, result.ambient));
  return result;
}

export async function updateMedia(root = process.cwd(), { development = false } = {}) {
  const path = resolve(root, 'content/works.json');
  const original = await readFile(path, 'utf8');
  const works = JSON.parse(original);
  const errors = validateWorks(works, root).filter(error => !(development && error.endsWith('：封面文件不存在')));
  if (errors.length) throw new Error(errors.join('\n'));
  for (const work of works) {
    let input;
    try { input = await readFile(resolve(root, 'public', work.cover)); }
    catch (error) {
      if (!development || error.code !== 'ENOENT') throw error;
      delete work.images; delete work.tone;
      console.warn(`${work.id}：开发预览使用缺图占位，请补 public/${work.cover}；生产构建仍会拒绝缺封面。`);
      continue;
    }
    work.tone = await imageTone(input);
    const hash = createHash('sha256').update(input).digest('hex');
    const paths = work.images ? [...work.images.avif, ...work.images.webp].map(image => image.src).concat(work.images.ambient) : [];
    const available = await Promise.all(paths.map(path => access(resolve(root, 'public', path)).then(() => true, () => false)));
    if (work.images?.sourceHash !== hash || paths.length !== 7 || available.some(value => !value)) {
      const images = await generateResponsive(input, { output: resolve(root, 'public', dirname(work.cover)), base: basename(work.cover, extname(work.cover)) });
      const prefix = dirname(work.cover);
      for (const format of ['avif', 'webp']) images[format] = images[format].map(image => ({ ...image, src: posix.join(prefix, image.src) }));
      images.ambient = posix.join(prefix, images.ambient);
      images.sourceHash = hash; work.images = images;
    }
  }
  const next = `${JSON.stringify(works, null, 2)}\n`;
  if (next !== original) await writeFile(path, next);
  return works;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) { await updateMedia(process.cwd(), { development: process.argv.includes('--dev') }); await copyDecoders(); }
