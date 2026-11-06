// Home page copy. Components never hold text; pages pass it in.
// Voice (docs/design-system.md · 文风): modern, warm and plain; professional without jargon;
// at most one light literary touch per page; every technical claim must be true of the code.
export const copy = {
  zh: {
    pageTitle: 'Three Atlas · 三维图鉴',
    skip: '跳到作品', navWorks: '作品', navAbout: '关于', navFollow: '关注观默', langLabel: 'EN', langAria: 'Switch to English',
    headline: '可以走进去的三维世界。',
    intro: '观默创作的交互式 3D 作品。点开任意一张，就能在浏览器里四处看看，不用下载，也不用登录。',
    featured: '精选', mode: '实时 3D', enter: '进入',
    collection: '全部作品', search: '搜索作品', placeholder: '搜索作品、主题或技术', filter: '按类别筛选', all: '全部',
    count: n => `${String(n).padStart(2, '0')} 个作品`,
    emptyTitle: '暂时没有找到这个世界。', emptyText: '换个关键词试试，或者回到全部作品。', reset: '查看全部作品',
    aboutTitle: '关于三维图鉴',
    about: [
      { title: '每个世界，各自完整', text: '每件作品都是独立的网页，有自己的渲染和交互，可以单独打开、刷新和分享。' },
      { title: '同一套零件', text: '卡片、导航、转场等界面组件全站共用，三维通用工具也整理成了套件，新作品上线更快。' },
      { title: '先看封面，再进世界', text: '首页只放封面和预览，点进作品才开始渲染，所以打开得很快。' },
      { title: '接下来', text: '规划中：把多件作品放进同一个空间，在一张星图里逛，遇到喜欢的就走进去。' },
    ],
    closing: '更多世界，正在路上。',
    colWorks: '作品', colAtlas: '图鉴', colAuthor: '作者',
  },
  en: {
    pageTitle: 'Three Atlas · Interactive 3D worlds',
    skip: 'Skip to works', navWorks: 'Works', navAbout: 'About', navFollow: 'Follow Guanmo', langLabel: '中文', langAria: '切换为中文',
    headline: 'A world of worlds.',
    intro: 'Interactive 3D works by Guanmo. Open any card and look around right in your browser, with nothing to download and no sign-in.',
    featured: 'Featured', mode: 'Real-time 3D', enter: 'Enter',
    collection: 'All works', search: 'Search works', placeholder: 'Search worlds, themes, or technology', filter: 'Filter by category', all: 'All',
    count: n => `${String(n).padStart(2, '0')} ${n === 1 ? 'work' : 'works'}`,
    emptyTitle: 'No world here yet.', emptyText: 'Try another word, or go back to all works.', reset: 'View all works',
    aboutTitle: 'About Three Atlas',
    about: [
      { title: 'Every world stands alone', text: 'Each work is its own web page, with its own rendering and controls. Open it, refresh it, share it.' },
      { title: 'One set of parts', text: 'Cards, navigation and transitions are shared across the site, and common 3D tools live in a shared kit, so new works arrive faster.' },
      { title: 'Covers first, worlds on demand', text: 'The home page shows only covers and previews. A world starts rendering when you step into it.' },
      { title: 'Next', text: 'In the works: bringing several worlds into one shared space, a single star map you can wander and step out of anywhere.' },
    ],
    closing: 'More worlds are on the way.',
    colWorks: 'Works', colAtlas: 'Atlas', colAuthor: 'Author',
  },
};
