export function adaptivePixelRatio(renderer, { min = 1, max = 2, budgetMs = 20, onChange } = {}) {
  if (!(min > 0 && max >= min && budgetMs > 0)) throw new Error('无效像素比或帧预算');
  let slowFrames = 0;
  renderer.setPixelRatio(Math.max(min, Math.min(max, renderer.getPixelRatio())));
  return { update(frameMs) {
    if (!(frameMs > 0) || !Number.isFinite(frameMs)) return renderer.getPixelRatio();
    slowFrames = frameMs > budgetMs ? slowFrames + 1 : 0;
    if (slowFrames >= 30) {
      slowFrames = 0;
      const before = renderer.getPixelRatio(), ratio = Math.max(min, before - 0.25);
      if (ratio !== before) { renderer.setPixelRatio(ratio); onChange?.(ratio); }
    }
    return renderer.getPixelRatio();
  }, reset() { slowFrames = 0; } };
}
