// Atlas UI · cross-document view transitions, page side.
// The clicked cover grows into the work page; on the way back the scene shrinks into the same cover.
// Pairs with scripts/vite/atlas-arrival.mjs (injected into every work page).
const NAME = 'atlas-world';
const KEY = 'three-atlas.from';
const FOCUS_KEY = 'three-atlas.return-focus';
const visible = node => { const r = node.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
function imageFor(source) {
  if (!source) return null;
  const container = document.querySelector(`[data-transition="${CSS.escape(source)}"]`)?.closest('.ui-window, .ui-card');
  const video = container?.querySelector('video.is-playing');
  const image = video && !video.paused ? video : container?.querySelector('img.world-image');
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
    if (link) {
      last = link.dataset.transition;
      try { sessionStorage.setItem(FOCUS_KEY, last); } catch { /* Optional. */ }
    }
  });
  const restore = () => {
    let source;
    try { source = sessionStorage.getItem(FOCUS_KEY); } catch { return; }
    if (!source) return;
    const target = document.querySelector(`a[data-transition="${CSS.escape(source)}"]:not([aria-hidden])`);
    if (target) requestAnimationFrame(() => { target.scrollIntoView({ block: 'center', behavior: 'instant' }); target.focus({ preventScroll: true }); });
    try { sessionStorage.removeItem(FOCUS_KEY); } catch { /* Optional. */ }
  };
  addEventListener('pageshow', event => { if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') restore(); });
  if (document.referrer.includes('/experiences/')) restore();
  addEventListener('pageswap', event => {
    if (!event.viewTransition || !last) return;
    try { sessionStorage.setItem(KEY, last); } catch { /* Optional. */ }
    name(imageFor(last), event.viewTransition);
  });
  addEventListener('pagereveal', event => {
    if (!event.viewTransition) return;
    if (!(globalThis.navigation?.activation?.from?.url || document.referrer).includes('/experiences/')) return;
    let source = null;
    try { source = sessionStorage.getItem(KEY); } catch { /* Optional. */ }
    name(imageFor(source), event.viewTransition);
  });
}
