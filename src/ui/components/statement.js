import { h } from '../dom.js';
import { lightUp } from '../motion.js';

/** Statement · one large paragraph that lights up as it is read. `muted` is appended in a quieter tone. */
export function Statement({ text, muted }) {
  return h('section.ui-statement.ui-section', null,
    h('div.ui-container', null, h('p.ui-statement__text', null, text, muted ? h('span.ui-statement__muted', null, ' ', muted) : null)));
}
// The muted colour already has 0.5 alpha: 0.72 is its large-text AA floor on --c-bg.
export const animateStatement = el => lightUp(el.querySelector('.ui-statement__text'), {
  opacity: (_index, word) => word.closest('.ui-statement__muted') ? 0.72 : 0.4,
});
