// The artwork remains a standalone page; the adapter supplies catalogue navigation and locale.
const key = 'three-atlas.language';
let lang = 'zh';
try { if (localStorage.getItem(key) === 'en') lang = 'en'; } catch { /* Preference is optional. */ }
const copy = {
  '一座面海的私人住宅，一湾无边泳池，还有在果冻海中游弋的鱼群。': 'A private seaside house, an infinity pool and fish swimming through a jelly lagoon.',
  '泻湖':'Lagoon','电影取景 ↗':'Cinematic view ↗','日光泻湖':'Daylight','金色海岸':'Golden coast','蓝调时刻':'Blue hour',
  '水上飞机':'Seaplane','投喂鱼群':'Feed fish','漂浮泳圈':'Add a float','浮桥候机':'At the dock',
  '浮筒转向':'Turning','滑行离港':'Taxiing out','起飞滑跑':'Taking off','爬升':'Climbing','环岛巡航':'Cruising',
  '进近泻湖':'Approaching','触水降落':'Landing','着水滑跑':'Landing run','转向返航':'Turning home','返回浮桥':'Returning',
  '降落':'Landings','已投喂':'Fed','漂浮':'Floats','风味':'Flavor','绿松石':'Turquoise','蓝宝石':'Sapphire','青柠':'Lime',
  '凝固度':'Firmness','波浪阻尼':'Wave damping','潮汐':'Tide','重置':'Reset','暂停':'Pause','继续':'Resume','重置视图':'Reset view',
  '玩法说明':'How to play','搅动泻湖。投喂鱼群。向水上飞机挥手道别。':'Stir the lagoon. Feed the fish. Wave goodbye to the seaplane.',
  '水面拖动搅拌 · 空白拖动环绕 · 滚轮 / 双指缩放 · Shift 拖动轻晃':'Drag water to stir · Drag elsewhere to orbit · Scroll or pinch to zoom · Shift-drag to tilt',
  '◌ 搅动':'◌ Stir','↔ 环绕':'↔ Orbit','≈ 轻晃':'≈ Tilt',
  '自动运镜 · 开':'Auto camera · on','自动运镜 · 关':'Auto camera · off','退出取景 ×':'Exit view ×',
  '一座房子，一池海色，一片会发光的礁。':'A house, a pool and a reef that glows.',
  '白沙浅海，棕榈的影子慢慢移动。':'Shallow water and the slow shadows of palms.',
  '海变成蓝色，窗内的灯一盏盏亮起。':'The water turns blue and the lights come on.',
  '海岛全景':'Island view','住宅近景':'Villa close-up','水下花园':'Underwater garden','日光':'Day','金色':'Golden','蓝调':'Blue',
  '这片泻湖，需要 WebGPU。':'This lagoon needs WebGPU.',
  '当前浏览器暂未提供 WebGPU。请使用支持 WebGPU 的新版 Chrome、Edge 或 Safari，并开启硬件加速。在本地使用 localhost，或通过 HTTPS 打开。':'WebGPU is unavailable. Use a current browser with WebGPU and hardware acceleration, on localhost or HTTPS.',
  '重新检测':'Try again','环岛航班':'Island flight','优先返航':'Returning early','欢迎回来':'Welcome back',
  '撒下 16 颗小点心，等它们游过来。':'Sixteen morsels are drifting down to the fish.',
  '一个新泳圈。拖起来，再轻轻抛下。':'A new float. Pick it up and give it a toss.',
  '泻湖已恢复，下一班航班即将出发。':'The lagoon is reset. The next flight leaves soon.',
  '最后一位乘客，准备出发。':'The final passenger is aboard. Ready for departure.',
  '已安排提前返航，请留意水面。':'An early return is arranged. Watch the water.',
  '触水。欢迎回到这片小小的泻湖。':'Touchdown. Welcome back to the lagoon.',
};
const reverse = Object.fromEntries(Object.entries(copy).map(([zh,en]) => [en,zh]));
const labels = {
  '#scene':['Island Jelly 互动泻湖。拖动水面搅动，在空白处拖动环绕，滚轮或双指缩放；Shift 拖动轻晃。','Interactive jelly lagoon. Drag the water to stir; drag elsewhere to orbit; scroll or pinch to zoom.'],
  '#panel':['泻湖控制面板','Lagoon controls'], '.film-hud':['电影取景','Cinematic view'],
  '.look-controls':['场景光景','Lighting'], '.flavors':['果冻风味','Jelly flavor'],
  '.scene-tools':['手势工具','Gesture tools'], '.film-shots':['电影镜头','Camera views'], '.film-looks':['场景光景','Lighting'],
  '.progress':['水上飞机航程','Seaplane progress'],
};
function translateNode(node) {
  if (node.parentElement?.closest('script,style,svg,canvas')) return;
  const match = node.nodeValue.match(/^(\s*)(.*?)(\s*)$/s); if (!match) return;
  const current=match[2], zh=reverse[current] || current;
  let value=lang==='en' ? copy[zh] : reverse[current];
  if (!value && lang==='en') {
    const next=zh.match(/^下一班 · (\d+) s$/), cruise=zh.match(/^低空巡航 · (.+)$/);
    if(next)value=`Next flight · ${next[1]} s`;
    else if(cruise)value=`Cruising · ${cruise[1]}`;
  } else if (!value && lang==='zh') {
    const next=current.match(/^Next flight · (\d+) s$/), cruise=current.match(/^Cruising · (.+)$/);
    if(next)value=`下一班 · ${next[1]} s`;
    else if(cruise)value=`低空巡航 · ${cruise[1]}`;
  }
  if(value && value!==current)node.nodeValue=match[1]+value+match[3];
}
function paint(root=document.body) {
  if(root.nodeType===Node.TEXT_NODE)translateNode(root);
  else if(root.nodeType===Node.ELEMENT_NODE) {
    if(root.matches('script,style,svg,canvas'))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())translateNode(walker.currentNode);
  }
}
function refresh() {
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  for(const [selector,[zh,en]] of Object.entries(labels))for(const el of document.querySelectorAll(selector))el.setAttribute('aria-label',lang==='zh'?zh:en);
  for(const link of document.querySelectorAll('.atlas-return'))link.setAttribute('aria-label',lang==='zh'?'返回三维图鉴':'Back to Three Atlas');
  for(const button of document.querySelectorAll('[data-atlas-language]')){button.textContent=lang==='zh'?'EN':'中文';button.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换到中文');}
  const drawer=document.querySelector('#drawer'); if(drawer)drawer.setAttribute('aria-label',lang==='zh'?(drawer.getAttribute('aria-expanded')==='true'?'收起泻湖控制':'展开泻湖控制'):(drawer.getAttribute('aria-expanded')==='true'?'Close lagoon controls':'Open lagoon controls'));
  const film=document.querySelector('.film-launch[data-film]'); if(film)film.setAttribute('aria-label',lang==='zh'?'进入电影取景':'Enter cinematic view');
  paint();
}
for(const button of document.querySelectorAll('[data-atlas-language]'))button.addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';try{localStorage.setItem(key,lang)}catch{}refresh()});
const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')translateNode(record.target);else for(const node of record.addedNodes)paint(node)}});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
refresh();

document.addEventListener('click', event => { if(event.target.closest?.('#drawer,[data-film]')) setTimeout(refresh,0); });
