import { createImage, toneStyle } from '../image.js';
import { h, icon, pad } from '../dom.js';
import { Badge } from './button.js';

/**
 * WorkCard · cover-led card that opens a work page.
 * work: { id, entry, cover, alt, title, subtitle, summary, category, author } — strings already localized.
 */
export function WorkCard({ work, index, labels }) {
  const picture = h('div.ui-card__picture', { style: toneStyle(work.tone) },
    h('span.ui-card__fallback', { 'aria-hidden': 'true' }, 'Three Atlas'),
    createImage('ui-card__cover world-image', { src: work.cover, alt: work.alt, width: 1440, height: 900, loading: index === 0 ? 'eager' : 'lazy', decoding: 'async' }),
    h('span.ui-card__badge', null, Badge({ label: labels.mode, live: true })),
    h('span.ui-card__enter', { 'aria-hidden': 'true' }, labels.enter, icon('arrow', 14)));
  picture.querySelector('img').addEventListener('error', event => { event.target.hidden = true; picture.classList.add('is-missing'); }, { once: true });
  return h('article.ui-card', { dataset: { workId: work.id } },
    h('a.ui-card__link', { href: work.entry, dataset: { transition: `card:${work.id}` } },
      h('div.ui-card__media', null, createImage('ui-ambient', { src: work.cover, alt: '', 'aria-hidden': 'true', loading: 'lazy', decoding: 'async' }), picture),
      h('div.ui-card__info', null,
        h('p.ui-card__meta', null, h('span.ui-card__no', null, pad(index + 1)), h('span', null, work.category)),
        h('h3.ui-card__title', null, work.title),
        h('p.ui-card__subtitle', null, work.subtitle),
        h('p.ui-card__summary', null, work.summary),
        h('p.ui-card__author', null, work.author))));
}
