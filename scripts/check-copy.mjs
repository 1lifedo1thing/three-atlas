import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const forbidden = ['极致', '颠覆', '震撼', '史诗级', '炸裂', '黑科技'];

export function scanCopy(data, file) {
  const errors = new Map();
  const add = (field, reason) => errors.set(`${field}:${reason}`, { file, field, reason });
  const visit = (value, field) => {
    if (typeof value === 'function') {
      // Current copy functions format counts and featured titles. Check branches as rendered text.
      for (const sample of [0, 1, 2, 'Three Atlas']) visit(value(sample), field);
    } else if (typeof value === 'string') {
      if (/[!！]/.test(value)) add(field, '包含感叹号');
      for (const word of forbidden) if (value.includes(word)) add(field, `包含禁用词「${word}」`);
    } else if (Array.isArray(value)) value.forEach((child, index) => visit(child, `${field}[${index}]`));
    else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) visit(child, field ? `${field}.${key}` : key);
    }
  };
  visit(data, '');
  return [...errors.values()];
}

export async function checkProjectCopy(root = fileURLToPath(new URL('../', import.meta.url))) {
  const { copy } = await import(pathToFileURL(resolve(root, 'src/gallery/copy.js')).href);
  const { copy: specimens } = await import(pathToFileURL(resolve(root, 'src/pages/ui/copy.js')).href);
  const works = JSON.parse(await readFile(resolve(root, 'content/works.json'), 'utf8'));
  const experiences = await Promise.all(works.map(async work => {
    const file = work.entry.replace(/index\.html$/, 'src/copy.js');
    if (!existsSync(resolve(root, file))) return [];
    const messages = await import(pathToFileURL(resolve(root, file)).href);
    return scanCopy(messages.copy ?? messages.MESSAGES, file);
  }));
  return [...scanCopy(copy, 'src/gallery/copy.js'), ...scanCopy(specimens, 'src/pages/ui/copy.js'), ...scanCopy(works, 'content/works.json'), ...experiences.flat()];
}

export function reportCopyErrors(errors) {
  for (const { file, field, reason } of errors) console.error(`${file} · ${field}：${reason}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = await checkProjectCopy();
  reportCopyErrors(errors);
  if (errors.length) process.exitCode = 1;
  else console.log('文风检查通过：无感叹号或禁用词。');
}
