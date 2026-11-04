/** Delegated listeners also cover cards replaced by catalogue searches. */
export function bindPointerGlow(root) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, rect, x = 0, y = 0, scrollX = 0, scrollY = 0, raf = 0;
  const clear = () => { active?.classList.remove('is-pointer-active'); active = null; cancelAnimationFrame(raf); raf = 0; };
  const draw = () => {
    raf = 0;
    if (!active) return;
    active.style.setProperty('--mx', `${x - rect.left + window.scrollX - scrollX}px`);
    active.style.setProperty('--my', `${y - rect.top + window.scrollY - scrollY}px`);
  };
  const enter = event => {
    if (!fine.matches || motion.matches || !(event.target instanceof Element)) return;
    const element = event.target.closest('.ui-card__picture, .ui-panel');
    if (!element || !root.contains(element) || active === element) return;
    clear(); active = element;
    rect = element.getBoundingClientRect();
    scrollX = window.scrollX; scrollY = window.scrollY;
    x = event.clientX; y = event.clientY; draw();
    element.classList.add('is-pointer-active');
  };
  const move = event => {
    if (!active) return;
    x = event.clientX; y = event.clientY;
    if (!raf) raf = requestAnimationFrame(draw);
  };
  const leave = event => { if (event.target === active) clear(); };
  root.addEventListener('pointerenter', enter, true);
  root.addEventListener('pointermove', move, { passive: true });
  root.addEventListener('pointerleave', leave, true);
  fine.addEventListener('change', clear); motion.addEventListener('change', clear);
  return () => {
    clear(); root.removeEventListener('pointerenter', enter, true); root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave, true);
    fine.removeEventListener('change', clear); motion.removeEventListener('change', clear);
  };
}
