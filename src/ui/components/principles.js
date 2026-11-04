import { h } from '../dom.js';

/** Principles · a row of three to four ideas, each led by a single large glyph. items: [{ glyph, label, title, text }] */
export function Principles({ id, head, items }) {
  return h('section.ui-principles.ui-section', { id, 'aria-labelledby': `${id}-title` },
    h('div.ui-container', null,
      head,
      h('ol.ui-principles__row', { 'data-reveal': 'group' }, items.map(item =>
        h('li.ui-principle', null,
          h('span.ui-principle__glyph.ui-glyph', { lang: 'zh-CN', 'aria-hidden': 'true' }, item.glyph),
          h('p.ui-principle__label', null, item.label),
          h('h3.ui-principle__title', null, item.title),
          h('p.ui-principle__text', null, item.text))))));
}
