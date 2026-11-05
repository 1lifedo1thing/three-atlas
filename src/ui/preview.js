// Shared network policy and one playback owner across windows and cards.
export function canPlayPreview({ inView, pageVisible, reducedMotion = false, connection }) {
  return Boolean(inView && pageVisible && !reducedMotion && !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType));
}

const previews = new Set();
let active = null;
let interaction = 0;
function reconcile() {
  const available = [...previews].filter(preview => preview.permitted());
  const next = available.filter(preview => preview.hover).sort((a, b) => b.order - a.order)[0]
    ?? (available.includes(active) ? active : available[0]);
  if (active === next) return;
  active?.pause();
  active = next ?? null;
  active?.play();
}

export function observePreview(section, { hover = false } = {}) {
  const video = section.querySelector('video[data-preview]');
  if (!video) return () => {};
  video.muted = true;
  const trigger = section.querySelector('[data-preview-trigger]') ?? section.querySelector('.ui-window__stage') ?? section;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const connection = navigator.connection;
  const threshold = section.classList.contains('ui-card--featured') ? 0.5 : 0;
  let inView = false, loaded = false, disposed = false, failed = false;
  let pointed = false, focused = false, ready = false, loadTimer, resetTimer;
  const controller = {
    video, hover, order: 0,
    permitted: () => !disposed && !failed && (!hover || (fine.matches && ready))
      && canPlayPreview({ inView, pageVisible: !document.hidden, reducedMotion: motion.matches, connection }),
    pause: () => { video.pause(); video.classList.remove('is-playing'); },
    play: () => {
      if (!loaded) {
        const size = matchMedia('(max-width: 960px), (pointer: coarse)').matches ? 960 : 1920;
        for (const [extension, type] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) {
          const source = document.createElement('source');
          source.src = `${video.dataset.preview}-${size}.${extension}`; source.type = type;
          video.append(source);
        }
        video.load(); loaded = true;
      }
      video.play().catch(error => {
        // A different card, backgrounding or disposal may interrupt a pending play().
        if (disposed || active !== controller || error.name === 'AbortError') return;
        failed = true; controller.pause(); reconcile();
      });
    },
  };
  previews.add(controller);
  const update = () => { failed = false; reconcile(); };
  const intent = () => {
    clearTimeout(loadTimer);
    if (fine.matches && (pointed || focused)) {
      clearTimeout(resetTimer);
      if (!ready) loadTimer = setTimeout(() => { ready = true; controller.order = ++interaction; update(); }, 120);
    } else {
      ready = false; update();
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { if (loaded) video.currentTime = 0; }, 300);
    }
  };
  const enter = () => { pointed = true; intent(); };
  const leave = () => { pointed = false; intent(); };
  const focus = () => { focused = true; intent(); };
  const blur = event => { if (!trigger.contains(event.relatedTarget)) { focused = false; intent(); } };
  const playing = () => { if (active === controller && controller.permitted()) video.classList.add('is-playing'); else controller.pause(); };
  const onPause = () => video.classList.remove('is-playing');
  const observer = new IntersectionObserver(entries => {
    const entry = entries[entries.length - 1];
    inView = entry.isIntersecting && entry.intersectionRatio >= threshold; update();
  }, { threshold });
  observer.observe(trigger);
  if (hover) {
    trigger.addEventListener('pointerenter', enter); trigger.addEventListener('pointerleave', leave);
    trigger.addEventListener('focusin', focus); trigger.addEventListener('focusout', blur);
    fine.addEventListener('change', intent);
  }
  video.addEventListener('playing', playing); video.addEventListener('pause', onPause);
  document.addEventListener('visibilitychange', update); motion.addEventListener('change', update); connection?.addEventListener('change', update);
  return () => {
    disposed = true; clearTimeout(loadTimer); clearTimeout(resetTimer); observer.disconnect();
    previews.delete(controller); controller.pause(); reconcile();
    trigger.removeEventListener('pointerenter', enter); trigger.removeEventListener('pointerleave', leave);
    trigger.removeEventListener('focusin', focus); trigger.removeEventListener('focusout', blur); fine.removeEventListener('change', intent);
    video.removeEventListener('playing', playing); video.removeEventListener('pause', onPause);
    document.removeEventListener('visibilitychange', update); motion.removeEventListener('change', update); connection?.removeEventListener('change', update);
    video.replaceChildren(); video.removeAttribute('src'); video.load();
  };
}
