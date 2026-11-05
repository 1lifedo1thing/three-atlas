import { h, icon } from '../dom.js';
import { WorkCard } from './work-card.js';
import { observePreview } from '../preview.js';

/**
 * WorkIndex · searchable, filterable catalogue of WorkCards.
 * select(query, category) → localized works · categories: [string] (chips appear when there are 2+)
 */
export function WorkIndex({ id, head, select, categories = [], labels }) {
  let query = '', category = null, previews = [];
  const count = h('p.ui-index__count', { role: 'status', 'aria-live': 'polite' });
  const grid = h('div.ui-index__grid');
  const empty = h('div.ui-index__empty', { hidden: true },
    h('h3.ui-h3', null, labels.emptyTitle), h('p.ui-small', null, labels.emptyText),
    h('button.ui-btn.ui-btn--secondary.ui-btn--md', { type: 'button', onClick: () => { input.value = ''; query = ''; category = null; paint(); input.focus(); } }, labels.reset));
  const input = h('input', { type: 'search', placeholder: labels.placeholder, autocomplete: 'off', enterkeyhint: 'search', onInput: e => { query = e.target.value; paint(); } });
  const search = h('label.ui-search', null, icon('search', 15), h('span.ui-sr', null, labels.search), input, h('kbd', { 'aria-hidden': 'true' }, '/'));
  const chips = categories.length > 1 ? h('div.ui-chips', { role: 'group', 'aria-label': labels.filter },
    [null, ...categories].map(c => h('button.ui-chip', { type: 'button', 'aria-pressed': String(c === null), onClick: e => { category = c; e.currentTarget.parentElement.querySelectorAll('.ui-chip').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); paint(); } }, c ?? labels.all))) : null;

  function paint() {
    const list = select(query, category);
    grid.dataset.count = String(list.length);
    previews.forEach(stop => stop());
    grid.replaceChildren(...list.map(work => WorkCard({ work, index: work.index, labels })));
    // The featured card plays its preview while in view. Hover previews for regular cards: see docs/design-polish.md · A2.
    previews = [...grid.querySelectorAll('.ui-card--featured')].map(card => observePreview(card));
    count.textContent = labels.count(list.length);
    empty.hidden = list.length !== 0;
  }
  paint();
  const el = h('section.ui-index.ui-container', { id, 'aria-labelledby': `${id}-title` },
    head,
    h('div.ui-index__bar', null, h('div.ui-index__title', null, count, chips), h('div.ui-index__tools', null, search)),
    grid, empty);
  return Object.assign(el, { focusSearch: () => input.focus({ preventScroll: true }), dispose: () => previews.forEach(stop => stop()) });
}
