import './style.css';
import { Raycaster, Sphere, Vector2, Vector3 } from 'three';
import { createWorld } from './world.js';
import { AmbientAudio } from './audio.js';

const canvas = document.querySelector('#scene');
const motion = document.querySelector('#motion');
const sound = document.querySelector('#sound');
const reset = document.querySelector('#reset');
const glow = document.querySelector('#glow');
const glowValue = document.querySelector('#glow-value');
const toast = document.querySelector('#toast');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const audio = new AmbientAudio();
const abort = new AbortController();
const eventOptions = { signal: abort.signal };
let world, toastTimer, hasExplored = false, pointerDown;
const glowStorageKey = 'last-island.glow.v1';
let initialGlow = 55;
try {
  const stored = Number.parseFloat(localStorage.getItem(glowStorageKey));
  if (Number.isFinite(stored)) initialGlow = Math.max(0, Math.min(100, Math.round(stored)));
} catch { /* The scene also works when browser storage is unavailable. */ }

function syncGlow(value) {
  glow.value = String(value);
  glowValue.value = `${value}%`;
  glow.setAttribute('aria-valuetext', `${value}%`);
  glow.style.setProperty('--glow-fill', `${value}%`);
}
syncGlow(initialGlow);

function notify(message) {
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function fail(message) {
  document.querySelector('#error-message').textContent = message;
  document.querySelector('#error').hidden = false;
  document.querySelector('#loading').hidden = true;
  canvas.dataset.state = 'error';
}

function syncMotion() {
  const paused = !world.rotationEnabled;
  motion.setAttribute('aria-pressed', String(paused));
  motion.setAttribute('aria-label', paused ? '继续自动旋转' : '暂停自动旋转');
  motion.title = motion.getAttribute('aria-label');
}

async function initialize() {
  try {
    canvas.dataset.state = 'loading';
    world = await createWorld(canvas, {
      reducedMotion: preference.matches,
      glow: initialGlow / 100,
      onInteraction() {
        if (!hasExplored) { hasExplored = true; document.querySelector('#hint').style.opacity = '.6'; }
      },
    });
    canvas.dataset.state = 'ready'; document.body.classList.add('ready');
    syncMotion();
  } catch (error) {
    console.error('[Where Stars Rest]', error);
    fail('请使用支持 WebGL 2 的现代浏览器，并开启硬件加速。如果画面仍无法载入，请重新载入页面。');
    return;
  }

  const resizeObserver = new ResizeObserver(() => world.resize());
  resizeObserver.observe(canvas);
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    world.setPointer(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1);
  }, eventOptions);
  document.addEventListener('pointerleave', () => world.setPointer(0, 0), eventOptions);
  glow.addEventListener('input', () => {
    const value = Number(glow.value);
    syncGlow(value); world.setGlow(value / 100);
    try { localStorage.setItem(glowStorageKey, String(value)); } catch { /* Optional preference. */ }
  }, eventOptions);

  motion.addEventListener('click', () => { world.setAutoRotate(!world.rotationEnabled); syncMotion(); }, eventOptions);
  reset.addEventListener('click', () => { world.reset(); notify('已回到最初的星海'); }, eventOptions);
  sound.addEventListener('click', async () => {
    sound.disabled = true;
    try {
      const enabled = await audio.toggle();
      sound.setAttribute('aria-pressed', String(enabled));
      sound.setAttribute('aria-label', enabled ? '关闭氛围音' : '开启氛围音');
      sound.title = sound.getAttribute('aria-label');
      notify(enabled ? '星海有了声音' : '回归宁静');
    } catch (error) { notify(error.message); }
    finally { sound.disabled = false; }
  }, eventOptions);

  const raycaster = new Raycaster(), ndc = new Vector2();
  const canopy = new Sphere(new Vector3(-.22, 3.4, -.18), 2.18), hit = new Vector3();
  canvas.addEventListener('pointerdown', event => {
    pointerDown = event.isPrimary ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null;
  }, eventOptions);
  canvas.addEventListener('pointerup', event => {
    if (!pointerDown || event.pointerId !== pointerDown.id || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) { pointerDown = null; return; }
    pointerDown = null;
    const rect = canvas.getBoundingClientRect();
    ndc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(ndc, world.camera);
    if (raycaster.ray.intersectSphere(canopy, hit)) { world.pulse(); notify('这束光，回应了你。'); }
  }, eventOptions);
  canvas.addEventListener('pointercancel', () => { pointerDown = null; }, eventOptions);
  canvas.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', ' ', 'Home'].includes(event.key)) event.preventDefault();
    const offset = world.camera.position.clone().sub(world.controls.target);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      offset.applyAxisAngle(new Vector3(0, 1, 0), event.key === 'ArrowLeft' ? -.1 : .1);
      world.camera.position.copy(world.controls.target).add(offset);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const angle = event.key === 'ArrowUp' ? -.06 : .06;
      const axis = new Vector3(0, 1, 0).cross(offset).normalize();
      offset.applyAxisAngle(axis, angle); world.camera.position.copy(world.controls.target).add(offset);
    } else if (['+', '=', '-'].includes(event.key)) {
      const distance = Math.max(world.controls.minDistance, Math.min(world.controls.maxDistance, offset.length() * (event.key === '-' ? 1.08 : .92)));
      world.camera.position.copy(world.controls.target).add(offset.setLength(distance));
    } else if (event.key === 'Home') world.reset();
    else if (event.key === ' ') { world.pulse(); notify('这束光，回应了你。'); }
  }, eventOptions);

  preference.addEventListener('change', event => { world.setReducedMotion(event.matches); syncMotion(); }, eventOptions);
  document.addEventListener('visibilitychange', () => {
    world.setVisible(!document.hidden);
    audio.setVisible(!document.hidden).catch(() => {});
  }, eventOptions);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); world.setVisible(false);
    fail('图形上下文暂时中断。请重新载入，回到这片星海。');
  }, eventOptions);

  const cleanup = () => {
    resizeObserver.disconnect(); clearTimeout(toastTimer); abort.abort();
    world.dispose(); audio.dispose();
  };
  window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); }, eventOptions);
  import.meta.hot?.dispose(cleanup);
}

initialize();
