import { Timer } from 'three';
export function createLoop(renderer, tick) {
  const timer = new Timer(); timer.connect(document);
  let running = false, paused = false, active = false, disposed = false;
  const frame = time => { timer.update(time); tick(timer.getDelta(), timer.getElapsed(), time); };
  const sync = () => {
    const next = running && !paused && !document.hidden && !disposed;
    if (next === active) return;
    active = next; if (active) timer.reset();
    renderer.setAnimationLoop(active ? frame : null);
  };
  document.addEventListener('visibilitychange', sync);
  return {
    start() { if (disposed) return; running = true; sync(); },
    stop() { running = false; sync(); },
    setPaused(value) { paused = Boolean(value); sync(); },
    dispose() { disposed = true; sync(); document.removeEventListener('visibilitychange', sync); timer.dispose(); },
  };
}
