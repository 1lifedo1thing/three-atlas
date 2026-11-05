// Visibility/network policy is shared by the preview controller and its tests.
export function canPlayPreview({ inView, pageVisible, reducedMotion = false, connection }) {
  return Boolean(inView && pageVisible && !reducedMotion && !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType));
}

let active = null;

export function observePreview(section) {
  const video = section.querySelector('video[data-preview]');
  if (!video) return () => {};
  video.muted = true;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let inView = false, loaded = false, disposed = false;
  const permitted = () => !disposed && canPlayPreview({ inView, pageVisible: !document.hidden, reducedMotion: motion.matches, connection });
  const pause = () => {
    video.pause(); video.classList.remove('is-playing');
    if (active?.video === video) active = null;
  };
  const update = () => {
    if (!permitted()) { pause(); return; }
    if (!loaded) {
      const size = matchMedia('(max-width: 960px), (pointer: coarse)').matches ? 960 : 1920;
      for (const [extension, type] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) {
        const source = document.createElement('source');
        source.src = `${video.dataset.preview}-${size}.${extension}`; source.type = type;
        video.append(source);
      }
      video.load(); loaded = true;
    }
    if (active?.video !== video) active?.pause();
    active = { video, pause };
    video.play().catch(() => { video.classList.remove('is-playing'); });
  };
  const playing = () => { if (permitted()) video.classList.add('is-playing'); else pause(); };
  const onPause = () => video.classList.remove('is-playing');
  const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; update(); });
  observer.observe(section.querySelector('[data-preview-trigger]') ?? section.querySelector('.ui-window__stage') ?? section);
  video.addEventListener('playing', playing);
  video.addEventListener('pause', onPause);
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
  connection?.addEventListener('change', update);
  return () => {
    disposed = true; observer.disconnect(); pause();
    video.removeEventListener('playing', playing); video.removeEventListener('pause', onPause);
    document.removeEventListener('visibilitychange', update); motion.removeEventListener('change', update); connection?.removeEventListener('change', update);
    video.replaceChildren(); video.removeAttribute('src'); video.load();
  };
}
