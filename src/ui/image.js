import { h } from './dom.js';

/** Register before setting src: cached and failed images follow the same decode gate. */
export function createImage(className, { src, ...props }) {
  const image = h(`img.ui-image.${className.replaceAll(' ', '.')}`, props);
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
  return image;
}

export const toneStyle = tone => tone ? { '--work-tone': tone } : {};
