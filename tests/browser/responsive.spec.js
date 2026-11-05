import{test,expect}from'@playwright/test';
for(const [device,viewport,scale,expected]of[['mobile',{width:390,height:844},1,720],['desktop',{width:1440,height:900},2,2880]])test(`${device} 选择真实响应式封面，环境光只取 160px`,async({browser})=>{
 const context=await browser.newContext({viewport,deviceScaleFactor:scale,reducedMotion:'reduce'});const page=await context.newPage();const jpeg=[];page.on('request',r=>{if(r.url().endsWith('/media/where-stars-rest.jpg'))jpeg.push(r.url())});
 try{await page.goto('http://127.0.0.1:5214/');const img=page.locator('[data-work-id="where-stars-rest"] .ui-card__cover');await expect(img).toHaveClass(/is-ready/);
 expect(await img.evaluate(e=>e.currentSrc)).toMatch(new RegExp(`-${expected}\\.avif$`));await expect(page.locator('[data-work-id="where-stars-rest"] picture source[type="image/webp"]')).toHaveAttribute('srcset',/720w.*1440w.*2880w/);
 expect(jpeg).toEqual([]);
 expect(await page.locator('.ui-ambient').first().evaluate(e=>e.currentSrc)).toMatch(/-ambient.webp$/);
 }finally{await context.close()}
});
