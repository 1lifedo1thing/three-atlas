import { h, icon } from '../dom.js';
import { WorkCard } from './work-card.js';
import { observePreview } from '../preview.js';

/**
 * WorkIndex · searchable, filterable catalogue of WorkCards.
 * select(query, category) → localized works · categories: [string] (chips appear when there are 2+)
 */
export function WorkIndex({ id, head, select, categories = [], labels }) {
  let query = '', category = null;
  const cards = new Map();
  const count = h('p.ui-index__count', { role: 'status', 'aria-live': 'polite' });
  const grid = h('div.ui-index__grid');
  const empty = h('div.ui-index__empty', { hidden: true },
    h('h3.ui-h3', null, labels.emptyTitle), h('p.ui-small', null, labels.emptyText),
    h('button.ui-btn.ui-btn--secondary.ui-btn--md', { type: 'button', onClick: () => {
      input.value = ''; query = ''; category = null;
      chips?.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === 0)));
      paint(); input.focus();
    } }, labels.reset));
  const input = h('input', { type: 'search', placeholder: labels.placeholder, autocomplete: 'off', enterkeyhint: 'search', onInput: e => { query = e.target.value; paint(); } });
  const search = h('label.ui-search', null, icon('search', 15), h('span.ui-sr', null, labels.search), input, h('kbd', { 'aria-hidden': 'true' }, '/'));
  const chips = categories.length > 1 ? h('div.ui-chips', { role: 'group', 'aria-label': labels.filter },
    [null, ...categories].map(c => h('button.ui-chip', { type: 'button', 'aria-pressed': String(c === null), onClick: e => { category = c; e.currentTarget.parentElement.querySelectorAll('.ui-chip').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); paint(); } }, c ?? labels.all))) : null;

  function paint() {
    const list = select(query, category);
    const ids = new Set(list.map(work => work.id));
    for (const [id, card] of cards) if (!ids.has(id)) {
      card.stop(); card.el.remove(); cards.delete(id);
    }
    list.forEach((work, index) => {
      let card = cards.get(work.id);
      if (!card) {
        const el = WorkCard({ work, index: work.index, labels, uniform: true });
        card = { el, stop: observePreview(el, { hover: !work.featured }) };
        cards.set(work.id, card);
      }
      // Matching cards keep their decoded media and playback state while typing.
      const at = grid.children[index];
      if (at !== card.el) grid.insertBefore(card.el, at ?? null);
    });
    if (grid.dataset.count !== String(list.length)) grid.dataset.count = String(list.length);
    const resultCount = labels.count(list.length);
    if (count.textContent !== resultCount) count.textContent = resultCount;
    empty.hidden = list.length !== 0;
  }
  paint();
  const el = h('section.ui-index.ui-container', { id, 'aria-labelledby': `${id}-title` },
    head,
    h('div.ui-index__bar', null, h('div.ui-index__title', null, count, chips), h('div.ui-index__tools', null, search)),
    grid, empty);
  return Object.assign(el, { focusSearch: () => input.focus({ preventScroll: true }), dispose: () => cards.forEach(card => card.stop()) });
}
