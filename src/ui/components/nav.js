import { h, brandMark } from '../dom.js';
import { Button } from './button.js';

/**
 * GlobalNav · fixed top bar.
 * links: [{ label, href }] · cta: { label, href, attrs } shown once the page calls nav.showCta(true) · lang: { label, aria, onToggle }
 */
export function GlobalNav({ home = './', links = [], cta, lang }) {
  const ctaEl = cta ? Button({ ...cta, size: 'sm', icon: null }) : null;
  ctaEl?.classList.add('ui-nav__cta');
  ctaEl?.setAttribute('tabindex', '-1');
  const el = h('header.ui-nav', null,
    h('div.ui-nav__inner.ui-container', null,
      h('a.ui-nav__brand', { href: home, 'aria-label': 'Three Atlas' }, brandMark(), h('span', null, 'Three Atlas')),
      h('nav.ui-nav__links', { 'aria-label': 'Three Atlas' }, links.map(link => h('a.ui-nav__link', { href: link.href }, link.label))),
      h('div.ui-nav__end', null,
        ctaEl,
        lang ? h('button.ui-nav__lang', { type: 'button', 'aria-label': lang.aria, onClick: lang.onToggle }, lang.label) : null)));
  return Object.assign(el, {
    showCta(on) { el.classList.toggle('is-cta', on); ctaEl?.setAttribute('tabindex', on ? '0' : '-1'); },
    setScrolled(on) { el.classList.toggle('is-scrolled', on); },
  });
}
