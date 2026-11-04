import{test,expect}from'@playwright/test';
for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]])for(const lang of ['zh','en'])test(`${device}-${lang}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto(`/pages/ui/?lang=${lang}`);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}))});
 await expect(page).toHaveScreenshot(`${device}-${lang}.png`,{fullPage:true});
});
