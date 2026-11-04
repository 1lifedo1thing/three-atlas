import { cp, mkdir, readFile, writeFile, rename, rm, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const exists = async path => access(path).then(() => true, () => false);
const escapeHTML = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export async function newWork({ root = process.cwd(), id, title, subtitle }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? '') || id === 'gallery') throw new Error('ID 必须为小写字母数字与连字符，且不能是 gallery。');
  if (![title, subtitle].every(text => typeof text === 'string' && text.trim())) throw new Error('请提供标题与中文副标题。');
  const catalogue = resolve(root, 'content/works.json');
  const works = JSON.parse(await readFile(catalogue, 'utf8'));
  const destination = resolve(root, 'experiences', id);
  if (works.some(work => work.id === id) || await exists(destination)) throw new Error(`作品已存在，不覆盖：${id}`);
  const work = { id, title, subtitle: { zh: subtitle, en: title }, summary: { zh: '一个独立运行的三维实验。', en: 'An independent 3D experiment.' }, category: { zh: '实验', en: 'Experiment' }, tags: ['threejs'], entry: `experiences/${id}/index.html`, cover: `media/${id}.jpg`, coverAlt: { zh: `${title} 的作品封面`, en: `Cover of ${title}` }, author: works[0]?.author ?? { name: '观默', handle: 'guanmo_ai' }, featured: false };
  await mkdir(resolve(root, 'experiences'), { recursive: true });
  const temporary = `${catalogue}.${id}.tmp`;
  try {
    await cp(resolve(root, 'experiences/_template'), destination, { recursive: true, errorOnExist: true, force: false });
    const path = resolve(destination, 'index.html');
    let html = await readFile(path, 'utf8');
    const json = JSON.stringify({ title, subtitle }).replaceAll('<', '\\u003c');
    html = html.replaceAll('__TITLE_HTML__', escapeHTML(title)).replaceAll('__SUBTITLE_HTML__', escapeHTML(subtitle)).replace('__WORK_JSON__', json);
    await writeFile(path, html);
    await writeFile(temporary, `${JSON.stringify([...works, work], null, 2)}\n`); await rename(temporary, catalogue);
  } catch (error) { await rm(destination, { recursive: true, force: true }); await rm(temporary, { force: true }); throw error; }
  return work;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const [id, title, subtitle] = process.argv.slice(2);
    const work = await newWork({ id, title, subtitle });
    console.log(`已创建 ${work.entry} 并追加目录。\n请补充 public/${work.cover} 的真实封面，再运行 npm run check；英文副标题、说明和封面描述需要按作品内容审阅。\n模板不进入构建，只有登记的新作品会构建。未自动提交或发布。`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
