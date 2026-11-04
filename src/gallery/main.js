// Home page: composes Atlas UI components from content/works.json. No Three.js here.
import '../ui/index.css';
import './gallery.css';
import works from '../../content/works.json';
import { pickFeatured, selectWorks } from './model.js';
import { copy, MODES } from './copy.js';
import {
  h, getLang, setLang, onLang, pick, gsap, ScrollTrigger, startScroll, scrollToTarget, reveal, riseLines, scope, reduced,
  bindTransitions, GlobalNav, Hero, FeatureWindow, animateFeatureWindow, Quote, Panels, Principles, lightUp,
  SectionHead, WorkIndex, Footer,
} from '../ui/index.js';

const app = document.querySelector('#app');
const lenis = startScroll();
let context = null;
let cleanups = [];
let workIndex = null;

/** Localized view model of a work, as components expect it. */
const view = work => ({
  id: work.id, entry: work.entry, cover: work.cover, index: works.indexOf(work),
  title: work.title, subtitle: pick(work.subtitle), summary: pick(work.summary), category: pick(work.category),
  alt: pick(work.coverAlt), author: `${work.author.name} / @${work.author.handle}`,
});

function render() {
  const lang = getLang();
  const t = copy[lang];
  context?.revert();
  cleanups.forEach(fn => fn());
  cleanups = [];
  document.title = t.pageTitle;

  const featured = pickFeatured(works);
  const f = featured && view(featured);
  const categories = [...new Set(works.map(w => pick(w.category)))];

  const nav = GlobalNav({
    links: [featured?.highlights?.length ? { label: t.navFeatured, href: '#featured' } : null, { label: t.navCraft, href: '#craft' }, { label: t.navWorks, href: '#works' }].filter(Boolean),
    cta: f && { label: t.enter, href: f.entry },
    lang: { label: t.langLabel, aria: t.langAria, onToggle: () => setLang(lang === 'zh' ? 'en' : 'zh') },
  });

  const hero = Hero({ eyebrow: t.eyebrow, title: t.headline, lede: t.intro });
  const opening = f && FeatureWindow({
    id: 'opening', work: f, live: t.mode, meta: [t.featured, f.category],
    enter: { label: t.enterLong, href: f.entry },
    more: featured.highlights?.length ? { label: t.more, href: '#featured' } : null,
  });
  const woyou = Quote({ id: 'woyou', eyebrow: t.woyouEyebrow, text: t.woyouQuote, translation: t.woyouTranslation, source: t.woyouSource, gloss: t.woyouGloss });
  const four = featured?.highlights?.length ? Panels({
    id: 'featured',
    vertical: lang === 'zh',
    head: SectionHead({ id: 'featured-title', size: 'h1', eyebrow: t.fourEyebrow, title: t.fourTitle, lede: t.fourLede }),
    items: featured.highlights.map(item => {
      const mode = MODES[item.mode] ?? { glyph: '·', zh: '', en: '' };
      return { glyph: mode.glyph, label: lang === 'zh' ? mode.zh : `${mode.zh} · ${mode.en}`, title: pick(item.title), text: pick(item.text), tech: pick(item.tech), image: featured.cover, focus: item.focus, zoom: item.zoom };
    }),
  }) : null;
  const craft = Principles({ id: 'craft', head: SectionHead({ id: 'craft-title', size: 'h1', eyebrow: t.craftEyebrow, title: t.craftTitle }), items: t.craft });
  workIndex = WorkIndex({
    id: 'works',
    head: h('div.ui-index__heading', null, h('p.ui-eyebrow', null, t.indexEyebrow), h('h2.ui-h2', { id: 'works-title' }, t.collection)),
    categories,
    select: (query, category) => selectWorks(works, query).filter(w => !category || pick(w.category) === category).map(view),
    labels: { ...t, count: t.count },
  });
  const footer = Footer({
    closing: t.closing,
    columns: [
      { title: t.colWorks, links: works.map(w => ({ label: w.title, href: w.entry })) },
      { title: t.colAtlas, links: [four ? { label: t.navFeatured, href: '#featured' } : null, { label: t.navCraft, href: '#craft' }, { label: t.navWorks, href: '#works' }].filter(Boolean) },
      { title: t.colAuthor, links: [{ label: `${works[0]?.author.name ?? '观默'} @guanmo_ai`, href: 'https://x.com/guanmo_ai', external: true }] },
    ],
    legal: [`© ${new Date().getFullYear()} 观默 Guanmo`, 'Three Atlas · 三维图鉴'],
    extra: h('button.ui-btn.ui-btn--ghost.ui-btn--sm', { type: 'button', 'aria-label': t.langAria, onClick: () => setLang(lang === 'zh' ? 'en' : 'zh') }, t.langLabel),
  });

  app.replaceChildren(
    h('a.ui-skip', { href: '#works' }, t.skip),
    nav,
    h('main', null, hero, opening, woyou, four, craft, workIndex),
    footer);

  context = scope(app, () => {
    if (!reduced()) {
      riseLines(hero.querySelector('.ui-hero__title'), { delay: 0.1 });
      gsap.from([hero.querySelector('.ui-hero__eyebrow'), hero.querySelector('.ui-hero__lede')], { autoAlpha: 0, y: 16, duration: 1.2, ease: 'expo.out', delay: 0.35, stagger: 0.1 });
      if (opening) gsap.from(opening.querySelector('.ui-window__frame'), { autoAlpha: 0, y: 48, duration: 1.6, ease: 'expo.out', delay: 0.5 });
    }
    if (opening) cleanups.push(animateFeatureWindow(opening));
    if (!reduced()) lightUp(woyou.querySelector('.ui-quote__gloss'));
    reveal(app);
    ScrollTrigger.create({ start: 8, end: 'max', onToggle: self => nav.setScrolled(self.isActive) });
    if (f) ScrollTrigger.create({ trigger: woyou, start: 'top 70%', endTrigger: workIndex, end: 'top 30%', onToggle: self => nav.showCta(self.isActive) });
  });
}

// In-page anchors go through Lenis so they glide like everything else.
document.addEventListener('click', event => {
  const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  if (!link || link.getAttribute('href').length < 2) return;
  event.preventDefault();
  scrollToTarget(link.getAttribute('href'));
});
addEventListener('keydown', event => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable]')) return;
  event.preventDefault();
  scrollToTarget('#works');
  setTimeout(() => workIndex?.focusSearch(), reduced() ? 0 : 700);
});
onLang(() => {
  const y = scrollY;
  render();
  ScrollTrigger.refresh();
  if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y);
});

render();
bindTransitions();
