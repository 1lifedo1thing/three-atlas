import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const media = await import('../scripts/media.mjs').catch(() => null);

test('占位色由真实像素平均值自动计算，不能手填固定颜色', async () => {
  assert.ok(media?.imageTone, '自动占位色尚未实现');
  const pixels = Buffer.from([20, 40, 60, 60, 80, 100]);
  const image = await sharp(pixels, { raw: { width: 2, height: 1, channels: 3 } }).png().toBuffer();
  assert.equal(await media.imageTone(image), '#283c50');
});

test('响应式输出 AVIF/WebP 三种真实宽度和 160px 环境光图', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os'); const { join } = await import('node:path');
  assert.ok(media?.generateResponsive, '缺少响应式生成');
  const root = await mkdtemp(join(tmpdir(), 'atlas-media-'));
  try {
    const input = await sharp({ create: { width: 2880, height: 1800, channels: 3, background: { r: 20, g: 40, b: 60 } } }).png().toBuffer();
    const result = await media.generateResponsive(input, { output: root, base: 'test' });
    for (const format of ['avif', 'webp']) {
      assert.deepEqual(result[format].map(image => image.width), [720,1440,2880]);
      for (const image of result[format]) assert.equal((await sharp(join(root,image.src)).metadata()).width, image.width);
    }
    assert.equal((await sharp(join(root,result.ambient)).metadata()).width,160);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('拒绝把低清封面放大成高清文件', async () => {
  const low = await sharp({create:{width:1440,height:900,channels:3,background:'#111111'}}).png().toBuffer();
  await assert.rejects(()=>media.generateResponsive(low,{output:'/unused',base:'low'}),/至少 2880px/);
});

test('新作品缺封面仍可开发预览，生产构建必须拒绝', async () => {
  const { mkdtemp, mkdir, writeFile, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os'); const { join } = await import('node:path');
  const root = await mkdtemp(join(tmpdir(),'atlas-missing-cover-'));
  try {
    const original = JSON.parse(await readFile('content/works.json','utf8'))[0];
    const work = { ...original, id:'new-work', entry:'experiences/new-work/index.html', cover:'media/new-work.jpg' };
    delete work.preview; delete work.images; delete work.tone;
    await mkdir(join(root,'content'));await mkdir(join(root,'experiences/new-work'),{recursive:true});await writeFile(join(root,work.entry),'<!doctype html>');await writeFile(join(root,'content/works.json'),JSON.stringify([work]));
    assert.equal((await media.updateMedia(root,{development:true}))[0].images,undefined);
    await assert.rejects(()=>media.updateMedia(root),/封面文件不存在/);
  } finally {await rm(root,{recursive:true,force:true});}
});

test('原图和合法元数据存在时自动重建缺失的衍生图', async () => {
  const { mkdtemp, mkdir, readFile, writeFile, cp, access, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os'); const { join, dirname } = await import('node:path');
  const root = await mkdtemp(join(tmpdir(),'atlas-regenerate-'));
  try {
    const work = JSON.parse(await readFile('content/works.json','utf8'))[0];delete work.preview;
    await mkdir(join(root,'content'));await mkdir(dirname(join(root,work.entry)),{recursive:true});await writeFile(join(root,work.entry),'<!doctype html>');await mkdir(join(root,'public/media'),{recursive:true});
    await cp(join('public',work.cover),join(root,'public',work.cover));
    const missing=work.images.avif[0].src;
    for(const path of [...work.images.avif,...work.images.webp].map(i=>i.src).concat(work.images.ambient))if(path!==missing)await cp(join('public',path),join(root,'public',path));
    await writeFile(join(root,'content/works.json'),JSON.stringify([work]));
    await media.updateMedia(root);await access(join(root,'public',missing));
  } finally {await rm(root,{recursive:true,force:true});}
});
