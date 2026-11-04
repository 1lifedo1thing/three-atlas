// Capture-only resolution override; never edits the scene source, geometry, materials or lighting.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const output=resolve('output/engineering-review/HD/native');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:process.platform==='darwin'?['--use-angle=metal','--enable-gpu']:[]});
try{
 const page=await browser.newPage({viewport:{width:2880,height:1800},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/experiences/where-stars-rest/src/world.js*',async route=>{
  const response=await route.fetch();const source=await response.text();assert.equal(source.split('1_850_000').length-1,1,'场景分辨率预算已变化，不能盲目覆盖');
  await route.fulfill({response,body:source.replace('1_850_000','5_184_000')});
 });
 await page.goto(`${process.env.ATLAS_REVIEW_URL||'http://127.0.0.1:5214/'}experiences/where-stars-rest/index.html`);
 await page.locator('body.ready').waitFor();await page.locator('#motion').click();await page.locator('#reset').click();await page.waitForTimeout(1800);
 const style=await page.addStyleTag({content:'.topbar,.bottom-bar,.glow-control,.location-label,.toast {visibility:hidden!important}'});
 const stats=await page.locator('#scene').evaluate(canvas=>({buffer:[canvas.width,canvas.height],scale:canvas.dataset.renderScale,fps:canvas.dataset.fps}));assert.deepEqual(stats.buffer,[2880,1800]);
 const png=resolve(output,'where-stars-rest-2880.png');await page.screenshot({path:png});
 await style.evaluate(el=>el.remove());assert.equal(await page.locator('.topbar').evaluate(el=>getComputedStyle(el).visibility),'visible');
 assert.deepEqual(errors,[]);await sharp(png).jpeg({quality:94,mozjpeg:true}).toFile('public/media/where-stars-rest.jpg');
 await writeFile(resolve(output,'capture.json'),JSON.stringify({stats,errors,uiRestored:true,sceneSourceChanged:false,resolutionOverride:'capture context only: 1,850,000 → 5,184,000 pixels'},null,2));
 console.log(JSON.stringify(stats));
}finally{await browser.close()}
