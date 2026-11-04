// Home page copy. Components never hold text; pages pass it in.
// Voice: warm, unhurried, sourced. Classical lines are quoted exactly with their source; every technical claim
// must be true of the code (see docs/design-system.md · 文风).

/** 郭熙《林泉高致》：山水可行、可望、可游、可居 — the four ways the featured work is shown. */
export const MODES = {
  walk: { glyph: '行', zh: '可行', en: 'To walk' },
  gaze: { glyph: '望', zh: '可望', en: 'To gaze' },
  wander: { glyph: '游', zh: '可游', en: 'To wander' },
  dwell: { glyph: '居', zh: '可居', en: 'To dwell' },
};

export const copy = {
  zh: {
    pageTitle: 'Three Atlas · 三维图鉴',
    skip: '跳到作品', navFeatured: '精选', navCraft: '技艺', navWorks: '作品', langLabel: 'EN', langAria: 'Switch to English',
    eyebrow: 'Three Atlas · 三维图鉴',
    headline: '咫尺之间，自有天地。',
    intro: '在浏览器里，走进一处处可以行走、眺望、游历与栖居的三维世界。',
    featured: '精选', mode: '实时交互', enter: '进入', enterLong: '走进这个世界', more: '细看',
    woyouEyebrow: '卧游',
    woyouQuote: '澄怀观道，卧以游之。',
    woyouSource: '宗炳，语见《宋书·宗炳传》',
    woyouGloss: '一千五百多年前，宗炳把一生游历过的山水画在居室四壁，老来卧床，也能神游其间，称为「卧游」。三维图鉴是今天的卧游：不必远行，也不必下载，打开浏览器，一个世界便在眼前徐徐展开。',
    fourEyebrow: '郭熙 · 《林泉高致》',
    fourTitle: '可行，可望，可游，可居。',
    fourLede: '九百多年前，郭熙说好的山水，要能让人行于其间、望于其远、游于其中、居于其下，而「可游可居」最为难得。WHERE STARS REST 把这四件事，交到你的指尖。',
    craftEyebrow: '技艺',
    craftTitle: '以代码为笔，以光为墨。',
    craft: [
      { glyph: '笔', label: '笔 · 代码', title: '一笔一画，皆由程序生成。', text: '山石、树冠、云层与萤火，都由代码写成。首作没有用到一张外部贴图、一个外部模型、一段录音。' },
      { glyph: '墨', label: '墨 · 光', title: '辉光晕开，如墨入绢。', text: '以 Three.js 实时渲染，辉光在后期处理中缓缓晕开。一万三千五百片树叶，以实例化一次绘成。' },
      { glyph: '纸', label: '纸 · 浏览器', title: '一页之上，轻装而至。', text: '无需下载，无需登录。图鉴只铺开封面，世界在你走进时才被点亮。' },
    ],
    indexEyebrow: '图录',
    collection: '全部作品。', search: '搜索作品', placeholder: '搜索作品、主题或技术', filter: '按类别筛选', all: '全部',
    count: n => `${String(n).padStart(2, '0')} 个作品`,
    emptyTitle: '这个世界，还没有画出来。', emptyText: '换一个词试试，或回到全部作品。', reset: '查看全部作品',
    closing: '此卷未完，世界还在生长。',
    colWorks: '作品', colAtlas: '图鉴', colAuthor: '作者',
  },
  en: {
    pageTitle: 'Three Atlas · Interactive 3D worlds',
    skip: 'Skip to works', navFeatured: 'Featured', navCraft: 'Craft', navWorks: 'Works', langLabel: '中文', langAria: '切换为中文',
    eyebrow: 'Three Atlas',
    headline: 'A world of worlds.',
    intro: 'Step into 3D worlds you can walk through, gaze across, wander in, and dwell in, right in your browser.',
    featured: 'Featured', mode: 'Real-time 3D', enter: 'Enter', enterLong: 'Step inside', more: 'Read more',
    woyouEyebrow: 'Wòyóu · Wandering at rest',
    woyouQuote: '澄怀观道，卧以游之。',
    woyouTranslation: 'Clear the heart, contemplate the Way, and travel while lying at rest.',
    woyouSource: 'Zong Bing (375–443), as recorded in the Book of Song',
    woyouGloss: 'Some fifteen centuries ago, the painter Zong Bing covered the walls of his room with the landscapes he had walked, so that in old age he could still travel them from his bed. He called it wòyóu. Three Atlas is a wòyóu for today: nowhere to go, nothing to install. Open a browser, and a world unfolds before you.',
    fourEyebrow: 'Guo Xi · The Lofty Message of Forests and Streams',
    fourTitle: 'To walk, to gaze, to wander, to dwell.',
    fourLede: 'Nine centuries ago, the painter Guo Xi wrote that a fine landscape lets you walk through it, gaze across it, wander in it, and dwell in it, and that the last two are the rarest. WHERE STARS REST places all four at your fingertips.',
    craftEyebrow: 'Craft',
    craftTitle: 'Code for a brush. Light for ink.',
    craft: [
      { glyph: '笔', label: 'Brush · Code', title: 'Every stroke is generated.', text: 'Rock, crown, cloud and firefly are all written in code. The first work uses not a single external texture, model, or recording.' },
      { glyph: '墨', label: 'Ink · Light', title: 'Light that spreads like ink on silk.', text: 'Rendered live with Three.js; in post-processing, the glow spreads slowly outward. Thirteen and a half thousand leaves, drawn at once through instancing.' },
      { glyph: '纸', label: 'Paper · The browser', title: 'Nothing to carry.', text: 'Nothing to install, nothing to sign in to. The atlas lays out only covers; a world lights up when you step inside.' },
    ],
    indexEyebrow: 'Index',
    collection: 'All works.', search: 'Search works', placeholder: 'Search worlds, themes, or technology', filter: 'Filter by category', all: 'All',
    count: n => `${String(n).padStart(2, '0')} ${n === 1 ? 'work' : 'works'}`,
    emptyTitle: 'This world has not been painted yet.', emptyText: 'Try another word, or return to all works.', reset: 'View all works',
    closing: 'The scroll goes on. More worlds are growing.',
    colWorks: 'Works', colAtlas: 'Atlas', colAuthor: 'Author',
  },
};
