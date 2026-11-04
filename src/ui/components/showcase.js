import { h } from '../dom.js';
/** An internal component specimen group, not linked from the public gallery. */
export function ShowcaseGroup({ id, label, children }) {
  return h('section.ui-showcase.ui-container', { id, 'aria-labelledby': `${id}-label` },
    h('h2.ui-eyebrow.ui-showcase__label', { id: `${id}-label` }, label),
    h('div.ui-showcase__body', null, children));
}
