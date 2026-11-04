import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWorks } from './content.mjs';

export async function imageTone(input) {
  const { channels } = await sharp(input).toColourspace('srgb').removeAlpha().stats();
  return `#${channels.slice(0, 3).map(channel => Math.round(channel.mean).toString(16).padStart(2, '0')).join('')}`;
}

export async function updateMedia(root = process.cwd()) {
  const path = resolve(root, 'content/works.json');
  const original = await readFile(path, 'utf8');
  const works = JSON.parse(original);
  const errors = validateWorks(works, root);
  if (errors.length) throw new Error(errors.join('\n'));
  for (const work of works) work.tone = await imageTone(resolve(root, 'public', work.cover));
  const next = `${JSON.stringify(works, null, 2)}\n`;
  if (next !== original) await writeFile(path, next);
  return works;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await updateMedia();
