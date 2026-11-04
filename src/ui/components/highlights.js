import { createImage, toneStyle } from '../image.js';
import { h, icon } from '../dom.js';

/** Centre the tile on `focus` at `zoom`, clamped so the crop never runs past the image edge. */
function frame({ focus = '50% 50%', zoom = 1 }) {
  const [fx, fy] = focus.split(' ').map(v => parseFloat(v) / 100);
  const half = 0.5 / zoom;
  const clamp = v => Math.min(1 - half, Math.max(half, v));
  return { '--zoom': String(zoom), '--tx': `${((0.5 - clamp(fx)) * 100).toFixed(2)}%`, '--ty': `${((0.5 - clamp(fy)) * 100).toFixed(2)}%` };
}

/**
 * Highlights · horizontal gallery of large tiles ("take a closer look").
 * items: [{ title, text, image, alt, focus: '50% 40%', zoom: 1.6 }]
 */
export function Highlights({ id, head, items, labels }) {
  const track = h('ul.ui-gallery__track', { tabindex: '0', 'aria-label': labels.region },
    items.map((item, i) => h('li.ui-tile', { 'aria-label': `${i + 1} / ${items.length}` },
      h('figure', null,
        h('div.ui-tile__media', { style: toneStyle(item.tone) },
          createImage('', { src: item.image, media: item.images, sizes: '(max-width: 720px) 200vw, 160vw', alt: item.alt ?? '', loading: 'lazy', decoding: 'async', style: frame(item) })),
        h('figcaption.ui-tile__caption', null, h('strong', null, item.title), ' ', item.text)))));
  const dots = h('div.ui-gallery__dots', null, items.map((_, i) => h('button.ui-gallery__dot', { type: 'button', 'aria-label': `${i + 1} / ${items.length}`, onClick: () => go(i) })));
  const prev = h('button.ui-gallery__paddle', { type: 'button', 'aria-label': labels.prev, onClick: () => go(active - 1) }, icon('prev'));
  const next = h('button.ui-gallery__paddle', { type: 'button', 'aria-label': labels.next, onClick: () => go(active + 1) }, icon('next'));
  const tiles = [...track.children];
  let active = 0;
  const go = i => {
    const tile = tiles[Math.max(0, Math.min(tiles.length - 1, i))];
    track.scrollTo({ left: tile.offsetLeft - tiles[0].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const sync = () => {
    const step = tiles[1] ? tiles[1].offsetLeft - tiles[0].offsetLeft : 1;
    active = Math.round(track.scrollLeft / step);
    tiles.forEach((t, i) => t.classList.toggle('is-active', i === active));
    [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === active)));
    prev.disabled = active <= 0;
    next.disabled = active >= tiles.length - 1;
  };
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  requestAnimationFrame(sync);
  return h('section.ui-highlights.ui-section', { id, 'aria-labelledby': `${id}-title` },
    h('div.ui-container', null, head),
    h('div.ui-gallery', { 'data-reveal': '' }, track,
      h('div.ui-gallery__controls.ui-container', null, dots, h('div.ui-gallery__paddles', null, prev, next))));
}
