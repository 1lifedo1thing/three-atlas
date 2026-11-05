import { createImage, toneStyle, coverPoster } from '../image.js';
import { h, icon, pad } from '../dom.js';
import { Badge } from './button.js';

const SIZES = { card: '(min-width: 1100px) 30vw, (min-width: 640px) 48vw, calc(100vw - 40px)', featured: '(min-width: 1100px) 66vw, calc(100vw - 40px)' };

/**
 * WorkCard · cover-led card that opens a work page.
 * work: { id, entry, cover, alt, title, subtitle, summary, category, featured, preview } — strings already localized.
 * The featured card is larger, carries its words over the picture, and plays its preview when in view.
 */
export function WorkCard({ work, index, labels }) {
  const featured = Boolean(work.featured);
  const picture = h('div.ui-card__picture', { style: toneStyle(work.tone) },
    h('span.ui-card__fallback', { 'aria-hidden': 'true' }, 'Three Atlas'),
    createImage('ui-card__cover world-image', { src: work.cover, media: work.images, sizes: featured ? SIZES.featured : SIZES.card, alt: work.alt, width: 1440, height: 900, loading: index < 3 ? 'eager' : 'lazy', decoding: 'async' }),
    work.preview ? h('video.ui-card__video.world-image', { muted: true, playsinline: true, loop: true, preload: 'none', poster: coverPoster(work), 'aria-hidden': 'true', dataset: { preview: work.preview } }) : null,
    h('span.ui-card__badge', null, Badge({ label: featured ? `${labels.featured} · ${labels.mode}` : labels.mode, live: true })),
    featured ? h('div.ui-card__overlay', null,
      h('p.ui-card__meta', null, h('span.ui-card__no', null, pad(index + 1)), h('span', null, work.category)),
      h('h3.ui-card__title', null, work.title),
      h('p.ui-card__subtitle', null, work.subtitle),
      h('p.ui-card__summary', null, work.summary)) : null,
    h('span.ui-card__enter', { 'aria-hidden': 'true' }, labels.enter, icon('arrow', 14)));
  picture.querySelector('img').addEventListener('error', event => { event.target.hidden = true; picture.classList.add('is-missing'); }, { once: true });
  return h(`article.ui-card${featured ? '.ui-card--featured' : ''}`, { dataset: { workId: work.id } },
    h('a.ui-card__link', { href: work.entry, dataset: { transition: `card:${work.id}` }, 'data-preview-trigger': '' },
      h('div.ui-card__media', null, createImage('ui-ambient', { src: work.cover, media: work.images, sizes: '30vw', alt: '', 'aria-hidden': 'true', loading: 'lazy', decoding: 'async' }), picture),
      featured ? null : h('div.ui-card__info', null,
        h('div.ui-card__heading', null, h('h3.ui-card__title', null, work.title), h('span.ui-card__category', null, work.category)),
        h('p.ui-card__subtitle', null, work.subtitle))));
}
