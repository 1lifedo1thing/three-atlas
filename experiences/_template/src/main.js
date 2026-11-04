import '../../../src/ui/index.css';
import { ExperienceShell } from '../../../src/ui/index.js';
import { Scene, PerspectiveCamera, Color, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { createRenderer, createLoop, createOrbit, observeSize, roomEnvironment, guardContext, adaptivePixelRatio, disposeObject, disposeLoaders } from '../../../src/kit/three/index.js';

const data = JSON.parse(document.querySelector('#work-data').textContent);
const shell = ExperienceShell({ title: data.title, subtitle: data.subtitle, canvasLabel: `${data.title} 三维场景，拖动或方向键环绕，滚轮缩放。`, home: '../../', backLabel: 'Three Atlas' });
document.querySelector('#app').append(shell);

try {
  const renderer = createRenderer(shell.canvas);
  const scene = new Scene(); scene.background = new Color(getComputedStyle(document.body).backgroundColor);
  const camera = new PerspectiveCamera(45, 1, 0.1, 100); camera.position.set(3, 2, 4);
  const controls = createOrbit(camera, shell.canvas, { minDistance: 2, maxDistance: 12 });
  const environment = roomEnvironment(renderer, scene);
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: new Color(getComputedStyle(document.body).color), roughness: 0.65, metalness: 0.2 }));
  scene.add(mesh);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const quality = adaptivePixelRatio(renderer);
  const stopResize = observeSize(renderer, camera);
  const loop = createLoop(renderer, delta => {
    if (!motion.matches) mesh.rotation.y += delta * 0.2;
    controls.update(delta); renderer.render(scene, camera); quality.update(delta * 1000);
  });
  const stopGuard = guardContext(shell.canvas, { onLost: () => loop.setPaused(true), onRestored: () => { quality.reset(); loop.setPaused(false); } });
  renderer.render(scene, camera); document.body.classList.add('ready'); loop.start();
  addEventListener('pagehide', event => {
    if (event.persisted) { loop.setPaused(true); return; }
    loop.dispose(); stopResize(); stopGuard(); controls.dispose(); environment.dispose(); disposeObject(scene); renderer.dispose(); disposeLoaders();
  });
  addEventListener('pageshow', event => { if (event.persisted) loop.setPaused(false); });
} catch (error) {
  shell.showError(`场景暂时无法启动：${error.message}`);
}
