import { h } from '../dom.js';

/** Portrait crop: keep `focus` in view and zoom about it. */
const frame = ({ focus = '50% 50%', zoom = 1 }) => ({ 'object-position': focus, 'transform-origin': focus, '--zoom': String(zoom) });

const painting = item => h('div.ui-panel__painting', null,
  h('img', { src: item.image, alt: item.alt ?? '', loading: 'lazy', decoding: 'async', style: frame(item) }));

const words = item => h('div.ui-panel__words', null,
  h('span.ui-panel__glyph.ui-glyph', { lang: 'zh-CN', 'aria-hidden': 'true' }, item.glyph),
  h('h3.ui-panel__title', null, h('span.ui-sr', null, `${item.label} · `), item.title),
  h('p.ui-panel__text', null, item.text));

const foot = item => h('p.ui-panel__foot', null,
  h('span.ui-panel__label', { 'aria-hidden': 'true' }, item.label),
  item.tech ? h('span', null, item.tech) : null);

const panel = item => h('li.ui-panel', null, painting(item), h('div.ui-panel__inscription', null, words(item), foot(item)));

/**
 * Panels · four hanging scrolls (四条屏) side by side. Each is mounted like a scroll:
 * the painting above (画心), the inscription below (题跋) — set vertically, right to left, in Chinese.
 * items: [{ glyph: '行', label: '可行', title, text, tech, image, focus, zoom }]
 */
export function Panels({ id, head, items, vertical = false }) {
  const row = h(`ol.ui-panels__row${vertical ? '.is-vertical' : ''}`, { 'data-reveal': 'group' }, items.map(panel));
  return h('section.ui-panels.ui-section', { id, 'aria-labelledby': `${id}-title` }, h('div.ui-container', null, head, row));
}
