import { h } from './dom.js';

/** Register before setting src: cached and failed images follow the same decode gate. */
export function mediaURL(path, reference) {
  const index = reference.indexOf('media/');
  return `${index < 0 ? '' : reference.slice(0, index)}${path}`;
}

export function coverPoster(work) {
  const width = matchMedia('(max-width: 960px), (pointer: coarse)').matches ? 720 : 1440;
  const poster = work.images?.webp?.find(image => image.width === width);
  return poster ? mediaURL(poster.src, work.cover) : work.cover;
}

export function createImage(className, { src, media, sizes = '100vw', ...props }) {
  const ambient = className.split(' ').includes('ui-ambient');
  const image = h('img.ui-image', { ...props, class: className });
  let result = image;
  if (media && ambient) src = mediaURL(media.ambient, src);
  else if (media) {
    const srcset = format => media[format].map(item => `${mediaURL(item.src, src)} ${item.width}w`).join(', ');
    result = h('picture.ui-picture', null,
      h('source', { type: 'image/avif', srcset: srcset('avif'), sizes }),
      h('source', { type: 'image/webp', srcset: srcset('webp'), sizes }), image);
    image.setAttribute('width', media.width); image.setAttribute('height', media.height);
    image.setAttribute('sizes', sizes);
  }
  let decoding = false;
  const ready = async () => {
    if (decoding) return;
    decoding = true;
    try {
      await image.decode();
      image.classList.add('is-ready');
    } catch { image.classList.add('is-error'); }
  };
  image.addEventListener('load', ready, { once: true });
  image.addEventListener('error', () => image.classList.add('is-error'), { once: true });
  image.src = src;
  if (image.complete && image.naturalWidth) ready();
  return result;
}

export const toneStyle = tone => tone ? { '--work-tone': tone } : {};
