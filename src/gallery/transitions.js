// Cross-document view transitions: the clicked cover grows into the work page,
// and returns to its card on the way back. Browsers without support navigate normally.
const NAME = 'atlas-world';
const KEY = 'three-atlas.from';

const visible = node => {
  const r = node.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0;
};

function imageFor(source) {
  if (!source) return null;
  const link = document.querySelector(`[data-transition="${CSS.escape(source)}"]`);
  const image = link?.querySelector('.world-image');
  return image && visible(image) ? image : null;
}

function name(image, transition) {
  if (!image) return;
  image.style.viewTransitionName = NAME;
  transition.finished.finally(() => { image.style.viewTransitionName = ''; });
}

export function bindTransitions() {
  let last = null;
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[data-transition]') : null;
    if (link) last = link.dataset.transition;
  });
  addEventListener('pageswap', event => {
    if (!event.viewTransition || !last) return;
    try { sessionStorage.setItem(KEY, last); } catch { /* Optional. */ }
    name(imageFor(last), event.viewTransition);
  });
  addEventListener('pagereveal', event => {
    if (!event.viewTransition) return;
    let source = null;
    try { source = sessionStorage.getItem(KEY); } catch { /* Optional. */ }
    const from = globalThis.navigation?.activation?.from?.url ?? '';
    if (!from.includes('/experiences/')) return;
    name(imageFor(source), event.viewTransition);
  });
}
