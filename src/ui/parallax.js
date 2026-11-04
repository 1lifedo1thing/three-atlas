export function parallaxTarget(x, y, rect) {
  if (!rect.width || !rect.height) return { x: 0, y: 0 };
  const clamp = value => Math.max(-1, Math.min(1, value));
  return { x: clamp((x - rect.left) / rect.width * 2 - 1) * 1.2, y: clamp((y - rect.top) / rect.height * 2 - 1) * 1.2 };
}

export function parallaxStep(current, target) {
  return { x: current.x + (target.x - current.x) * 0.08, y: current.y + (target.y - current.y) * 0.08 };
}

export function bindParallax(section) {
  const frame = section.querySelector('.ui-window__frame'), media = section.querySelector('.ui-window__media');
  const fine = matchMedia('(hover: hover) and (pointer: fine)'), motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = { x: 0, y: 0 }, target = { x: 0, y: 0 }, rect, raf = 0;
  const write = () => {
    media.style.setProperty('--pan-x', `${current.x}%`); media.style.setProperty('--pan-y', `${current.y}%`);
    // Derived overscan covers the exposed edge; at rest the existing framing is unchanged.
    media.style.setProperty('--pan-scale', String(1 + Math.max(Math.abs(current.x), Math.abs(current.y)) / 50));
  };
  const tick = () => {
    raf = 0; current = parallaxStep(current, target); write();
    if (Math.abs(current.x - target.x) + Math.abs(current.y - target.y) > 0.0001) raf = requestAnimationFrame(tick);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const enter = () => { if (fine.matches && !motion.matches) rect = frame.getBoundingClientRect(); };
  const move = event => {
    if (!rect || !fine.matches || motion.matches) return;
    target = parallaxTarget(event.clientX, event.clientY, rect); schedule();
  };
  const leave = () => { target = { x: 0, y: 0 }; schedule(); };
  const reset = () => { cancelAnimationFrame(raf); raf = 0; rect = null; current = target = { x: 0, y: 0 }; write(); };
  frame.addEventListener('pointerenter', enter); frame.addEventListener('pointermove', move, { passive: true }); frame.addEventListener('pointerleave', leave);
  fine.addEventListener('change', reset); motion.addEventListener('change', reset);
  write();
  return () => {
    reset(); frame.removeEventListener('pointerenter', enter); frame.removeEventListener('pointermove', move); frame.removeEventListener('pointerleave', leave);
    fine.removeEventListener('change', reset); motion.removeEventListener('change', reset);
  };
}
