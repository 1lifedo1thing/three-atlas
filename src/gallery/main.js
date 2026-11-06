// Home page: composes Atlas UI components from content/works.json. No Three.js here.
import '../ui/index.css';
import './gallery.css';
import works from '../../content/works.json';
import { pickFeatured, selectWorks } from './model.js';
import { copy } from './copy.js';
import {
  h, getLang, requestLang, onLang, pick, gsap, ScrollTrigger, startScroll, scrollToTarget, reveal, scope, reduced,
  claimEntrance, bindTransitions, bindPointerGlow, GlobalNav, animateNav, Hero, Principles, SectionHead, WorkIndex, Footer, animateFooter,
} from '../ui/index.js';

const app = document.querySelector('#app');
const lenis = startScroll();
let context = null;
let cleanups = [];
let workIndex = null;

/** Localized view model of a work, as components expect it. */
const view = (work, featured) => ({
  id: work.id, entry: work.entry, cover: work.cover, preview: work.preview, tone: work.tone, images: work.images, index: works.indexOf(work),
  featured: work === featured,
  title: work.title, subtitle: pick(work.subtitle), summary: pick(work.summary), category: pick(work.category),
  alt: pick(work.coverAlt), author: `${work.author.name} / @${work.author.handle}`,
});

/**
 * Home is a gallery: one line of title, one of description, then equally sized works with the featured one first.
 * Everything else (about, footer) waits below for whoever keeps scrolling.
 */
function render() {
  const lang = getLang();
  const t = copy[lang];
  context?.revert();
  cleanups.forEach(fn => fn());
  cleanups = [];
  workIndex?.dispose?.();
  document.title = t.pageTitle;

  const featured = pickFeatured(works);
  const categories = [...new Set(works.map(w => pick(w.category)))];
  const ordered = list => [...list].sort((a, b) => (b === featured) - (a === featured));

  const nav = GlobalNav({
    links: [{ label: t.navWorks, href: '#works' }, { label: t.navAbout, href: '#about' }],
    follow: { label: t.navFollow, href: 'https://x.com/guanmo_ai' },
    lang: { label: t.langLabel, aria: t.langAria, onToggle: event => requestLang(lang === 'zh' ? 'en' : 'zh', event.currentTarget) },
  });
  const hero = Hero({ compact: true, title: t.headline, lede: t.intro });
  workIndex = WorkIndex({
    id: 'works',
    head: h('h2.ui-sr', { id: 'works-title' }, t.collection),
    categories,
    select: (query, category) => ordered(selectWorks(works, query).filter(w => !category || pick(w.category) === category)).map(w => view(w, featured)),
    labels: { ...t, count: t.count },
  });
  const about = Principles({ id: 'about', compact: true, head: SectionHead({ id: 'about-title', size: 'h3', title: t.aboutTitle }), items: t.about });
  const footer = Footer({
    closing: t.closing,
    columns: [
      { title: t.colWorks, links: works.map(w => ({ label: w.title, href: w.entry })) },
      { title: t.colAtlas, links: [{ label: t.navWorks, href: '#works' }, { label: t.navAbout, href: '#about' }] },
      { title: t.colAuthor, links: [{ label: `${works[0]?.author.name ?? '观默'} @guanmo_ai`, href: 'https://x.com/guanmo_ai', external: true }] },
    ],
    legal: [`© ${new Date().getFullYear()} 观默 Guanmo`, 'Three Atlas · 三维图鉴'],
    extra: h('button.ui-btn.ui-btn--ghost.ui-btn--sm', { type: 'button', dataset: { langControl: 'footer' }, 'aria-label': `${t.langLabel} — ${t.langAria}`, onClick: event => requestLang(lang === 'zh' ? 'en' : 'zh', event.currentTarget) }, t.langLabel),
  });

  app.replaceChildren(
    h('a.ui-skip', { href: '#works' }, t.skip),
    nav,
    h('main', null, hero, workIndex, about),
    footer);

  context = scope(app, () => {
    cleanups.push(bindPointerGlow(app));
    if (claimEntrance() && !reduced()) {
      gsap.from(hero.children, { autoAlpha: 0, y: 16, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
      gsap.from(workIndex.querySelectorAll('.ui-index__bar, .ui-card'), { autoAlpha: 0, y: 24, duration: 1.1, ease: 'expo.out', stagger: 0.06, delay: 0.15 });
    }
    cleanups.push(animateFooter(footer));
    reveal(app);
    ScrollTrigger.create({ start: 8, end: 'max', onToggle: self => nav.setScrolled(self.isActive) });
    cleanups.push(animateNav(nav, app));
  });
  document.fonts.ready.then(() => { if (nav.isConnected) ScrollTrigger.refresh(true); });
}

// In-page anchors go through Lenis so they glide like everything else.
document.addEventListener('click', event => {
  const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  if (!link || link.getAttribute('href').length < 2) return;
  event.preventDefault();
  scrollToTarget(link.getAttribute('href'), { onComplete: link.classList.contains('ui-skip') ? () => workIndex?.focusSearch() : undefined });
});
addEventListener('keydown', event => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable]')) return;
  event.preventDefault();
  scrollToTarget('#works', { onComplete: () => workIndex?.focusSearch() });
});
onLang(() => {
  const y = scrollY;
  render();
  if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y);
});

render();
bindTransitions();
