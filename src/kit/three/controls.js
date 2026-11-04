import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export function createOrbit(camera, dom, { target = [0, 0, 0], autoRotate = false, minDistance = 0, maxDistance = Infinity, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const controls = new OrbitControls(camera, dom);
  if (Array.isArray(target)) controls.target.fromArray(target); else controls.target.copy(target);
  controls.enableDamping = true; controls.autoRotate = autoRotate && !reducedMotion;
  controls.minDistance = minDistance; controls.maxDistance = maxDistance;
  controls.listenToKeyEvents(dom); controls.update();
  return controls;
}
