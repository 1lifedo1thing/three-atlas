import { h } from '../dom.js';

/** Hero · the opening statement of a page. */
export function Hero({ eyebrow, title, lede, id = 'hero-title' }) {
  return h('section.ui-hero.ui-container', { 'aria-labelledby': id },
    eyebrow ? h('p.ui-eyebrow.ui-hero__eyebrow', null, eyebrow) : null,
    h('h1.ui-display.ui-hero__title', { id }, title),
    lede ? h('p.ui-lead.ui-hero__lede', null, lede) : null);
}
