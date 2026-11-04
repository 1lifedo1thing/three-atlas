export function guardContext(canvas, { onLost, onRestored } = {}) {
  const lost = event => { event.preventDefault(); onLost?.(event); };
  const restored = event => onRestored?.(event);
  canvas.addEventListener('webglcontextlost', lost); canvas.addEventListener('webglcontextrestored', restored);
  return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored); };
}
