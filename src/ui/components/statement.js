import { h } from '../dom.js';
import { lightUp } from '../motion.js';

/** Statement · one large paragraph that lights up as it is read. `muted` is appended in a quieter tone. */
export function Statement({ text, muted }) {
  return h('section.ui-statement.ui-section', null,
    h('div.ui-container', null, h('p.ui-statement__text', null, text, muted ? h('span.ui-statement__muted', null, ' ', muted) : null)));
}
export const animateStatement = el => lightUp(el.querySelector('.ui-statement__text'));
