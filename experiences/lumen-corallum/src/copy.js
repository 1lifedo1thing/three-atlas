const THREE_LICENSE_URL=new URL('../third-party/three-LICENSE.txt',import.meta.url).href;

export const MESSAGES={
 zh:{
  pageTitle:'幽珊 V2 · 萤光呼吸',homeLabel:'返回三维图鉴',wordmark:'形态研究',edition:'V2 · 萤光呼吸',previousVersion:'V1 · 褶带版 ↗',
  languageLabel:'语言',eyebrow:'想象生物 / CORALLUM',title:'幽<span>珊</span>',
  description:'薄如呼吸的膜。<br>随水舒展的触须。<br>一枚悬浮着的心。',
  stageLabel:'幽珊，可拖动旋转并缩放的三维发光生物',canvasLabel:'幽珊三维模型，可拖动或按 Shift 加方向键旋转',morphologyLabel:'形态组成',
  mantle:'半透明瓣膜',coral:'珊瑚分枝骨架',core:'悬浮种核',driftCaption:'缓慢漂游 · 内源幽光',
  viewsLabel:'观察视角',whole:'整体',skeleton:'骨架',seed:'种核',trails:'触须',
  noteWhole:'01 / 完整形态',noteSkeleton:'02 / 分枝骨架',noteSeed:'03 / 种核近观',noteTrails:'04 / 立体触须',
  pause:'暂停',resume:'继续',pauseLabel:'暂停漂游',resumeLabel:'继续漂游',wake:'唤光',clean:'纯享',back:'返回',cleanHint:'隐藏文字与操作（H）',
  interaction:'拖动旋转 <b>·</b> 滚动拉近 <b>·</b> 轻点唤光',author:'观默',about:'创作与来源 ↗',loading:'正在凝聚微光',
  closeAbout:'关闭来源说明',aboutEyebrow:'创作与来源',aboutTitle:'幽珊',
  aboutDescription:'V2 以略透明的圆润软触腕和多层细触须，延续水母瓣膜、珊瑚分枝与漂浮种核的融合形态。体内外萤光漂游，形体与光晕同步缓慢呼吸。造型、纹理与动态均由程序生成。',
  aboutReferences:'形态参考 <a href="https://www.mbari.org/animal/deep-sea-crown-jelly/" target="_blank" rel="noreferrer">MBARI 冠水母</a> 与 <a href="https://nautiluslive.org/video/2017/12/31/burst-deep-sea-fireworks-halitrephes-jelly" target="_blank" rel="noreferrer">Ocean Exploration Trust 的 Halitrephes 观察</a>；发光氛围参考 <a href="https://x.com/scottstts/status/2112866606988857719" target="_blank" rel="noreferrer">Scott 的 Lumen Hollow</a>。本作品的发光是艺术设定。',
  aboutLicense:`渲染使用 <a href="https://github.com/mrdoob/three.js" target="_blank" rel="noreferrer">Three.js authors</a> 的开源组件，遵循 <a href="${THREE_LICENSE_URL}" target="_blank">MIT License</a>。未使用参考照片、视频或外部模型资产。`,
  shortcuts:'空格 暂停 / 继续 · H 纯享 / 显示界面 · 1 / 2 / 3 / 4 切换观察视角',
  rendererError:'当前浏览器未能创建三维画布，请在支持 WebGL 2 的浏览器中打开。'
 },
 en:{
  pageTitle:'Lumen Corallum V2 · Living Light',homeLabel:'Back to Three Atlas',wordmark:'FORM STUDY',edition:'V2 · LIVING LIGHT',previousVersion:'V1 · Ribbon edition ↗',
  languageLabel:'Language',eyebrow:'IMAGINED LIFE / CORALLUM',title:'Corallum',
  description:'A membrane as light as breath.<br>Tentacles drifting with the current.<br>A heart suspended in light.',
  stageLabel:'Lumen Corallum, a glowing 3D creature you can rotate and zoom',canvasLabel:'Lumen Corallum 3D model; drag or use Shift and arrow keys to rotate',morphologyLabel:'Anatomy',
  mantle:'Translucent mantle',coral:'Coral skeleton',core:'Floating seed core',driftCaption:'Slow drift · Inner glow',
  viewsLabel:'Observation views',whole:'Whole',skeleton:'Skeleton',seed:'Core',trails:'Tentacles',
  noteWhole:'01 / Complete form',noteSkeleton:'02 / Branching skeleton',noteSeed:'03 / Seed core, close up',noteTrails:'04 / Volumetric tentacles',
  pause:'Pause',resume:'Resume',pauseLabel:'Pause drift',resumeLabel:'Resume drift',wake:'Awaken',clean:'Focus',back:'Back',cleanHint:'Hide text and controls (H)',
  interaction:'Drag to orbit <b>·</b> Scroll to zoom <b>·</b> Tap to glow',author:'Guanmo',about:'About & sources ↗',loading:'Gathering light',
  closeAbout:'Close about and sources',aboutEyebrow:'ABOUT & SOURCES',aboutTitle:'Corallum',
  aboutDescription:'Translucent, rounded arms and fine tentacles extend a form that brings together a jellyfish mantle, coral branches and a floating seed core. Motes drift within and around it as its body and glow breathe together. Geometry, textures and movement are generated with code.',
  aboutReferences:'Form studies draw on <a href="https://www.mbari.org/animal/deep-sea-crown-jelly/" target="_blank" rel="noreferrer">MBARI’s crown jelly</a> and <a href="https://nautiluslive.org/video/2017/12/31/burst-deep-sea-fireworks-halitrephes-jelly" target="_blank" rel="noreferrer">Ocean Exploration Trust’s Halitrephes observation</a>. The luminous atmosphere is inspired by <a href="https://x.com/scottstts/status/2112866606988857719" target="_blank" rel="noreferrer">Scott’s Lumen Hollow</a>. The creature’s own glow is an artistic interpretation.',
  aboutLicense:`Rendered with open-source components by the <a href="https://github.com/mrdoob/three.js" target="_blank" rel="noreferrer">Three.js authors</a> under the <a href="${THREE_LICENSE_URL}" target="_blank">MIT License</a>. No reference photos, videos or external model assets are included.`,
  shortcuts:'Space: pause / resume · H: hide / show interface · 1 / 2 / 3 / 4: switch views',
  rendererError:'The browser could not create a 3D canvas. Please open this page in a browser that supports WebGL 2.'
 }
};

export const LANGUAGE_STORAGE_KEY='three-atlas.language';
export const normalizeLanguage=value=>value==='en'?'en':'zh';
export function stateLabels(language,{paused=false,clean=false,view='whole'}={}){
 const m=MESSAGES[normalizeLanguage(language)],notes={whole:'noteWhole',skeleton:'noteSkeleton',seed:'noteSeed',trails:'noteTrails'};
 return {motion:m[paused?'resume':'pause'],motionLabel:m[paused?'resumeLabel':'pauseLabel'],clean:m[clean?'back':'clean'],note:m[notes[view]||'noteWhole']};
}

export function createI18n(doc,storage){
 let language='zh';try{language=normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY));}catch{}
 let state={paused:false,clean:false,view:'whole'};
 const t=key=>MESSAGES[language][key]??MESSAGES.zh[key];
 function applyState(){
  const labels=stateLabels(language,state),motion=doc.querySelector('#motion'),clean=doc.querySelector('#clean');
  motion.querySelector('span').textContent=labels.motion;motion.setAttribute('aria-label',labels.motionLabel);motion.setAttribute('aria-pressed',String(state.paused));
  clean.textContent=labels.clean;clean.setAttribute('aria-pressed',String(state.clean));
  doc.querySelector('#view-note').textContent=labels.note;
 }
 function apply(){
  doc.documentElement.lang=language==='en'?'en':'zh-CN';doc.title=t('pageTitle');
  for(const [attribute,target] of [['data-i18n','textContent'],['data-i18n-html','innerHTML']])for(const el of doc.querySelectorAll(`[${attribute}]`))el[target]=t(el.getAttribute(attribute));
  for(const [attribute,target] of [['data-i18n-aria','aria-label'],['data-i18n-title','title']])for(const el of doc.querySelectorAll(`[${attribute}]`))el.setAttribute(target,t(el.getAttribute(attribute)));
  for(const button of doc.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===language));
  applyState();
 }
 function setLanguage(next){language=normalizeLanguage(next);try{storage?.setItem(LANGUAGE_STORAGE_KEY,language);}catch{}apply();}
 for(const button of doc.querySelectorAll('[data-language]'))button.addEventListener('click',()=>setLanguage(button.dataset.language));
 apply();
 return {t,setLanguage,get language(){return language;},updateState(next){state={...state,...next};applyState();}};
}
