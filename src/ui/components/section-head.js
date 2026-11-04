import { h } from '../dom.js';

/** SectionHead · eyebrow, title, optional lede and actions. align: 'start' | 'center' · size: 'h1' | 'h2' */
export function SectionHead({ eyebrow, title, lede, actions = [], align = 'start', size = 'h2', id }) {
  return h(`header.ui-head.ui-head--${align}`, { 'data-reveal': 'group' },
    eyebrow ? h('p.ui-eyebrow', null, eyebrow) : null,
    h(`h2.ui-head__title.ui-${size}`, { id }, title),
    lede ? h('p.ui-head__lede.ui-lead', null, lede) : null,
    actions.length ? h('div.ui-head__actions', null, actions) : null);
}
