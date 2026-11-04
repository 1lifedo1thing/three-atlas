import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { mkdtemp, cp, symlink, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';import{join,resolve}from'node:path';import{spawn,execFile}from'node:child_process';import{promisify}from'node:util';
import { newWork } from '../../scripts/new-work.mjs';
test.use({video:{mode:'on',size:{width:1440,height:900}},contextOptions:{reducedMotion:'no-preference'}});
test('临时副本的新作出现在目录，直接刷新与卡片进入可用',async({page})=>{
 test.setTimeout(60000);const source=process.cwd(),root=await mkdtemp(join(tmpdir(),'atlas-template-browser-'));let server;
 try{
  for(const name of ['src','pages','experiences','scripts','content','public','third-party','vite.config.js','package.json','index.html'])await cp(join(source,name),join(root,name),{recursive:true});
  await symlink(join(source,'node_modules'),join(root,'node_modules'),'dir');
  const work=await newWork({root,id:'engineering-smoke',title:'ENGINEERING SMOKE',subtitle:'临时模板验证'});
  server=spawn(process.execPath,[join(source,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5314','--strictPort'],{cwd:root,stdio:'ignore'});
  for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:5314/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  await page.goto(`http://127.0.0.1:5314/${work.entry}`);await page.locator('body.ready').waitFor();
  await page.locator('canvas').screenshot({path:join(root,'public',work.cover),type:'jpeg'});
  await promisify(execFile)('npm',['run','build'],{cwd:root});
  const manifest=JSON.parse(await readFile(join(root,'dist/.vite/manifest.json'),'utf8'));expect(manifest[work.entry].isEntry).toBe(true);expect(Object.keys(manifest).some(k=>k.includes('_template'))).toBe(false);
  await page.goto('http://127.0.0.1:5314/');const card=page.locator('[data-work-id="engineering-smoke"] .ui-card__link');await card.scrollIntoViewIfNeeded();await card.click();
  await page.locator('body.ready').waitFor();await expect(page).toHaveURL(/engineering-smoke/);await expect(page.locator('.atlas-arrival')).toHaveCount(1);
  await page.reload();await page.locator('body.ready').waitFor();
  await page.waitForTimeout(3000);const pixels=await sharp(await page.locator('canvas').screenshot()).stats();expect(pixels.channels[0].max).toBeGreaterThan(50);
  await mkdir('output/engineering-review/TEMPLATE/after',{recursive:true});await page.screenshot({path:'output/engineering-review/TEMPLATE/after/template-smoke.png'});
  const video=page.video();await page.close();await video.saveAs('output/engineering-review/TEMPLATE/after/template-smoke.webm');
  expect(JSON.parse(await readFile(resolve(source,'content/works.json'),'utf8'))).toHaveLength(1);
 }finally{server?.kill();await rm(root,{recursive:true,force:true})}
});
