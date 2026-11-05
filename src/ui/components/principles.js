import { h } from '../dom.js';

/** Principles · three or four plain statements of how something works. items: [{ label, title, text }] */
export function Principles({ id, head, items, compact = false }) {
  return h(`section.ui-principles.ui-section${compact ? '.ui-principles--compact' : ''}`, { id, 'aria-labelledby': `${id}-title` },
    h('div.ui-container', null,
      head,
      h('ol.ui-principles__row', { 'data-reveal': 'group' }, items.map((item, i) =>
        h('li.ui-principle', null,
          h('p.ui-principle__index', { 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
          item.label ? h('p.ui-principle__label', null, item.label) : null,
          h('h3.ui-principle__title', null, item.title),
          h('p.ui-principle__text', null, item.text))))));
}
