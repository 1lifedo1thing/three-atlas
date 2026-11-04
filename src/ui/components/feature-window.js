import { createImage, toneStyle, coverPoster } from '../image.js';
import { h } from '../dom.js';
import { Badge, Button } from './button.js';
import { ScrollTrigger, reduced } from '../motion.js';
import { observePreview } from '../preview.js';
import { bindParallax } from '../parallax.js';

/**
 * FeatureWindow · a work shown through a rounded window that opens to full screen as the page scrolls.
 * work: { title, subtitle, cover, alt } · meta: [string] · enter / more: { label, href }
 */
export function FeatureWindow({ id, work, meta = [], live, enter, more }) {
  const titleId = `${id}-title`;
  return h('section.ui-window', { id, 'aria-labelledby': titleId, style: toneStyle(work.tone) },
    h('div.ui-window__stage', null,
      createImage('ui-ambient', { src: work.cover, media: work.images, alt: '', 'aria-hidden': 'true', decoding: 'async' }),
      h('div.ui-window__frame', null,
        h('div.ui-window__media', null,
          createImage('ui-window__image world-image', { src: work.cover, media: work.images, alt: work.alt, width: 1440, height: 900, decoding: 'async', fetchpriority: 'high' }),
          work.preview ? h('video.ui-window__video.world-image', { muted: true, playsinline: true, loop: true, preload: 'none', poster: coverPoster(work), 'aria-hidden': 'true', dataset: { preview: work.preview } }) : null),
        h('a.ui-window__hit', { href: enter.href, tabindex: '-1', 'aria-hidden': 'true', dataset: { transition: 'feature' } }),
        h('div.ui-window__shade'),
        h('div.ui-window__caption.ui-container', null,
          h('div.ui-window__words', null,
            h('p.ui-window__meta', null, live ? Badge({ label: live, live: true }) : null, meta.map(m => h('span', null, m))),
            h('h2.ui-window__title', { id: titleId }, work.title),
            h('p.ui-window__sub', null, work.subtitle)),
          h('div.ui-window__actions', null,
            Button({ ...enter, size: 'lg', attrs: { 'data-transition': 'feature' } }),
            more ? Button({ ...more, variant: 'secondary', size: 'lg', icon: 'down' }) : null)))));
}

const ease = t => 1 - Math.pow(1 - t, 3);

/** Scroll choreography. Call inside a motion scope. */
export function animateFeatureWindow(section) {
  const stage = section.querySelector('.ui-window__stage');
  const caption = section.querySelector('.ui-window__caption');
  let progress = 0;
  const apply = () => {
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const narrow = vw < 720;
    const gutter = narrow ? 16 : Math.min(72, vw * 0.044);
    const top = (narrow ? 64 : 72);
    const w0 = Math.min(vw - gutter * 2, 1320);
    const h0 = Math.min(narrow ? w0 * 1.25 : w0 * 0.5625, vh - top - gutter);
    const p = ease(progress);
    const s = section.style;
    s.setProperty('--t', `${top * (1 - p)}px`);
    s.setProperty('--x', `${((vw - w0) / 2) * (1 - p)}px`);
    s.setProperty('--b', `${Math.max(0, vh - top - h0) * (1 - p)}px`);
    s.setProperty('--p', p.toFixed(4));
    const captionOpacity = reduced() ? 1 : Math.min(1, Math.max(0, (p - 0.5) / 0.35));
    s.setProperty('--caption', captionOpacity.toFixed(3));
    caption.inert = captionOpacity < 1;
  };
  apply();
  const stopPreview = observePreview(section);
  const stopParallax = bindParallax(section);
  addEventListener('resize', apply);
  const cleanup = () => { removeEventListener('resize', apply); stopPreview(); stopParallax(); };
  if (reduced()) return cleanup;
  ScrollTrigger.create({ trigger: stage, start: 'top top', end: '+=115%', pin: true, scrub: true, onUpdate: self => { progress = self.progress; apply(); } });
  return cleanup;
}
