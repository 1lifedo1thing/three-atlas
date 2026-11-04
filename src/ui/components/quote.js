import { h } from '../dom.js';

/**
 * Quote · a classical line, its source, an optional translation, and a modern gloss that lights up as it is read.
 * text: original (always shown) · translation: shown under it (e.g. English) · source: '宗炳 · 《宋书》'
 */
export function Quote({ id, eyebrow, text, translation, source, gloss }) {
  return h('section.ui-quote.ui-section', { id },
    h('div.ui-container.ui-quote__inner', null,
      eyebrow ? h('p.ui-eyebrow', { 'data-reveal': '' }, eyebrow) : null,
      h('figure.ui-quote__figure', { 'data-reveal': 'group' },
        h('blockquote.ui-quote__text.ui-serif', { lang: 'zh-CN' }, text),
        translation ? h('p.ui-quote__translation', null, translation) : null,
        source ? h('figcaption.ui-quote__source', null, source) : null),
      gloss ? h('p.ui-quote__gloss', null, gloss) : null));
}
