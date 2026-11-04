export function observeSize(renderer, camera, { onResize } = {}) {
  const canvas = renderer.domElement;
  const target = canvas.parentElement || canvas;
  const apply = ({ width, height }) => {
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height, false);
    if (camera.isPerspectiveCamera) camera.aspect = width / height;
    camera.updateProjectionMatrix();
    onResize?.({ width, height, pixelRatio: renderer.getPixelRatio() });
  };
  const observer = new ResizeObserver(entries => apply(entries[0].contentRect));
  observer.observe(target); apply(target.getBoundingClientRect());
  return () => observer.disconnect();
}
