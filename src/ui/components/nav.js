import { h, brandMark, icon } from '../dom.js';
import { ScrollTrigger } from '../motion.js';
import { Button } from './button.js';

/**
 * GlobalNav · fixed top bar.
 * links: [{ label, href }] · follow: { label, href } always visible · cta: { label, href, attrs } shown once the page calls nav.showCta(true) · lang: { label, aria, onToggle }
 */
export function GlobalNav({ home = './', links = [], follow, cta, lang }) {
  const ctaEl = cta ? Button({ ...cta, size: 'sm', icon: null }) : null;
  ctaEl?.classList.add('ui-nav__cta');
  ctaEl?.setAttribute('tabindex', '-1');
  const el = h('header.ui-nav', null,
    h('div.ui-nav__inner.ui-container', null,
      h('a.ui-nav__brand', { href: home, 'aria-label': 'Three Atlas' }, brandMark(), h('span', null, 'Three Atlas')),
      h('nav.ui-nav__links', { 'aria-label': 'Three Atlas' }, links.map(link => h('a.ui-nav__link', { href: link.href }, link.label)), h('span.ui-nav__indicator', { 'aria-hidden': 'true' })),
      h('div.ui-nav__end', null,
        ctaEl,
        follow ? h('a.ui-nav__follow', { href: follow.href, target: '_blank', rel: 'noopener noreferrer' }, follow.label, icon('external', 14)) : null,
        lang ? h('button.ui-nav__lang', { type: 'button', dataset: { langControl: 'nav' }, 'aria-label': `${lang.label} — ${lang.aria}`, onClick: lang.onToggle }, lang.label) : null)));
  return Object.assign(el, {
    showCta(on) { el.classList.toggle('is-cta', on); ctaEl?.setAttribute('tabindex', on ? '0' : '-1'); },
    setScrolled(on) { el.classList.toggle('is-scrolled', on); },
  });
}

/** One shared dot moves between links; section boundaries cross the viewport midpoint. */
export function animateNav(nav, root = document) {
  const links = [...nav.querySelectorAll('.ui-nav__link')];
  const dot = nav.querySelector('.ui-nav__indicator');
  let active = null;
  const place = () => {
    dot.style.transform = `translateX(${active ? active.offsetLeft + active.offsetWidth / 2 - 2 : 0}px)`;
    dot.classList.toggle('is-visible', Boolean(active));
  };
  const triggers = [];
  const sync = () => {
    active = triggers.find(item => item.trigger.isActive)?.link ?? null;
    links.forEach(link => active === link ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'));
    place();
  };
  links.forEach(link => {
    const section = root.querySelector(link.getAttribute('href'));
    if (section) triggers.push({ link, trigger: ScrollTrigger.create({ trigger: section, start: 'top 50%', end: 'bottom 50%', onToggle: sync, onRefresh: () => queueMicrotask(sync) }) });
  });
  sync();
  const observer = new ResizeObserver(place);
  observer.observe(nav);
  return () => { observer.disconnect(); triggers.forEach(item => item.trigger.kill()); };
}
