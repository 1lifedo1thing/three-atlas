import { h } from '../dom.js';

/** Portrait crop: keep `focus` in view and zoom about it. */
const frame = ({ focus = '50% 50%', zoom = 1 }) => ({ 'object-position': focus, 'transform-origin': focus, '--zoom': String(zoom) });

const panel = (item, i) => h('li.ui-panel', null,
  h('div.ui-panel__painting', null, h('img', { src: item.image, alt: item.alt ?? '', loading: 'lazy', decoding: 'async', style: frame(item) })),
  h('div.ui-panel__body', null,
    h('p.ui-panel__index', null, String(i + 1).padStart(2, '0')),
    h('h3.ui-panel__title', null, item.title),
    h('p.ui-panel__text', null, item.text),
    item.tech ? h('p.ui-panel__tech', null, item.tech) : null));

/**
 * Panels · a row of tall feature cards: a picture cropped from the work, then a numbered title, a plain sentence,
 * and the technique behind it. items: [{ title, text, tech, image, focus, zoom }]
 */
export function Panels({ id, head, items }) {
  const row = h('ol.ui-panels__row', { 'data-reveal': 'group' }, items.map(panel));
  return h('section.ui-panels.ui-section', { id, 'aria-labelledby': `${id}-title` }, h('div.ui-container', null, head, row));
}
