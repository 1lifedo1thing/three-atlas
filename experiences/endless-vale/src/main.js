import '../../../src/ui/tokens.css';
import '../../../src/ui/base.css';
import '../../../src/ui/components/button.css';
import './style.css';
import { ACESFilmicToneMapping, DirectionalLight, HemisphereLight, PCFShadowMap, PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { h } from '../../../src/ui/dom.js';
import { Button } from '../../../src/ui/components/button.js';
import { getLang, setLang, onLang, htmlLang } from '../../../src/ui/i18n.js';
import { createLoop } from '../../../src/kit/three/loop.js';
import { observeSize } from '../../../src/kit/three/resize.js';
import { adaptivePixelRatio } from '../../../src/kit/three/quality.js';
import { guardContext } from '../../../src/kit/three/lifecycle.js';
import { copy } from './copy.js';
import { atmosphere, applyTime } from './atmosphere.js';
import { lighting } from './materials.js';
import { sampleTime, START_HOUR, HOURS_PER_SECOND, PRESETS, forwardHours, clock } from './time.js';
import { landAt } from './world.js';
import { Flight } from './flight.js';
import { createSky } from './sky.js';
import { Reflection, LAYER_NO_REFLECTION } from './water.js';
import { createStreamer } from './streamer.js';
import { Land } from './land.js';
import { createMotes, createLanterns } from './particles.js';
import { createFlock } from './birds.js';
import { Pipeline } from './post.js';
import { createAmbience } from './audio.js';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const handheld = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 640;
const QUALITY = {
  high: { range: 1650, split: 1.7, minTile: 64, tileRes: 48, objectRange: 640, grassRange: 135, grassDensity: 1, shadows: true, shadowSize: 2048, reflection: 0.5, samples: 4, rays: true, pixelRatio: 1.75, motes: 1600, clouds: 5, workers: 2 },
  low: { range: 1300, split: 1.5, minTile: 64, tileRes: 32, objectRange: 440, grassRange: 92, grassDensity: 0.55, shadows: true, shadowSize: 1024, reflection: 0, samples: 0, rays: false, pixelRatio: 1.5, motes: 700, clouds: 4, workers: 1 },
};
const tier = QUALITY[params.get('quality')] ? params.get('quality') : handheld ? 'low' : 'high';
const Q = { ...QUALITY[tier] };
// Cover capture renders at an exact device pixel ratio (for example ?dpr=2).
if (Number(params.get('dpr')) > 0) Q.pixelRatio = Math.min(Number(params.get('dpr')), 3);
const t = key => copy[getLang()][key] ?? copy.zh[key];
const TIMES = ['flow', 'dawn', 'day', 'dusk', 'night'];

// ── Interface ─────────────────────────────────────────────────────────────
const root = document.querySelector('#app');
const canvas = h('canvas.ev-canvas', { tabindex: '0' });
const back = Button({ label: 'Three Atlas', href: '../../', icon: 'back', variant: 'secondary', size: 'sm', attrs: { class: 'ev-back' } });
const langButtons = ['zh', 'en'].map(code => h('button.ev-chip', { type: 'button', lang: code === 'zh' ? 'zh-CN' : 'en', dataset: { lang: code }, onClick: () => setLang(code) }, code === 'zh' ? '中文' : 'EN'));
const langGroup = h('div.ev-lang', { role: 'group' }, langButtons);
const title = h('h1.ui-h2.ev-title', null, 'ENDLESS VALE');
const eyebrow = h('p.ui-eyebrow'), subtitle = h('p.ev-subtitle'), lead = h('p.ui-small.ev-lead');
const readout = {};
const readoutList = h('dl.ev-readout', null, ['distance', 'speed', 'clock', 'land'].map(key => {
  readout[key] = { label: h('dt'), value: h('dd', { dataset: { readout: key } }) };
  return h('div', null, readout[key].label, readout[key].value);
}));
const timeButtons = TIMES.map(name => h('button.ev-chip', { type: 'button', dataset: { time: name }, onClick: () => chooseTime(name) }));
const timeGroup = h('div.ev-times', { role: 'group' }, timeButtons);
const pauseButton = Button({ label: '', variant: 'secondary', size: 'sm', icon: null, attrs: { id: 'pause', 'aria-pressed': 'false' }, onClick: () => togglePause() });
const ambience = createAmbience();
const soundButton = Button({ label: '', variant: 'ghost', size: 'sm', icon: null, attrs: { id: 'sound', 'aria-pressed': 'false' }, onClick: () => toggleSound() });
const cleanButton = Button({ label: '', variant: 'ghost', size: 'sm', icon: null, attrs: { id: 'clean', 'aria-pressed': 'false' }, onClick: () => toggleClean() });
const aboutButton = Button({ label: '', variant: 'ghost', size: 'sm', icon: 'external', attrs: { id: 'about' }, onClick: () => about.showModal() });
const hint = h('p.ev-hint');
const banner = h('p.ev-banner', { 'aria-live': 'polite' });
const loaderText = h('p.ui-eyebrow'), loaderBar = h('i');
const loader = h('div.ev-loader', { role: 'status' }, h('div.ev-loader__bar', null, loaderBar), loaderText);
const aboutTitle = h('h2.ui-h3'), aboutBody = h('div.ev-about__body'), aboutKeys = h('p.ev-about__keys');
const aboutClose = Button({ label: '', variant: 'secondary', size: 'sm', icon: null, onClick: () => about.close() });
const about = h('dialog.ev-about', null, aboutTitle, aboutBody, aboutKeys, aboutClose);
about.addEventListener('click', event => { if (event.target === about) about.close(); });
const errorText = h('p.ev-error', { role: 'alert', hidden: true });

root.append(canvas, h('div.ev-scrim', { 'aria-hidden': 'true' }),
  h('header.ev-top', null, back, langGroup),
  h('section.ev-intro', null, eyebrow, title, subtitle, lead),
  h('footer.ev-bottom', null, readoutList, h('div.ev-controls', null, timeGroup, h('div.ev-actions', null, pauseButton, soundButton, cleanButton, aboutButton))),
  hint, banner, loader, errorText, about);

let paused = reduced, cleanMode = false, timeMode = 'flow', timeTarget = null, hour = Number(params.get('hour')) || START_HOUR;
let currentLand = -1, interacted = false;

function renderCopy() {
  const lang = getLang();
  document.documentElement.lang = htmlLang();
  document.title = t('pageTitle');
  back.setAttribute('aria-label', t('homeLabel'));
  langGroup.setAttribute('aria-label', t('languageLabel'));
  for (const button of langButtons) button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
  eyebrow.textContent = t('eyebrow'); subtitle.textContent = t('subtitle'); lead.textContent = t('lead');
  canvas.setAttribute('aria-label', t('canvasLabel'));
  for (const key of ['distance', 'speed', 'clock', 'land']) readout[key].label.textContent = t(key);
  timeGroup.setAttribute('aria-label', t('timeLabel'));
  for (const button of timeButtons) { button.textContent = t('times')[button.dataset.time]; button.setAttribute('aria-label', t('timesLabel')[button.dataset.time]); }
  cleanButton.title = t('cleanHint');
  aboutButton.querySelector('.ui-btn__label').textContent = t('about');
  hint.textContent = reduced && paused ? t('reducedHint') : t('hint');
  loaderText.textContent = t('loading');
  aboutTitle.textContent = t('aboutTitle');
  aboutBody.replaceChildren(...t('aboutBody').map(text => h('p', null, text)));
  aboutKeys.textContent = t('shortcuts');
  aboutClose.querySelector('.ui-btn__label').textContent = t('closeAbout');
  renderState();
  updateReadout(true);
}
function renderState() {
  pauseButton.querySelector('.ui-btn__label').textContent = t(paused ? 'resume' : 'pause');
  pauseButton.setAttribute('aria-label', t(paused ? 'resumeLabel' : 'pauseLabel'));
  pauseButton.setAttribute('aria-pressed', String(paused));
  soundButton.querySelector('.ui-btn__label').textContent = t(ambience.on ? 'soundOff' : 'sound');
  soundButton.setAttribute('aria-label', t(ambience.on ? 'soundOffLabel' : 'soundLabel'));
  soundButton.setAttribute('aria-pressed', String(ambience.on));
  cleanButton.querySelector('.ui-btn__label').textContent = t(cleanMode ? 'cleanBack' : 'clean');
  cleanButton.setAttribute('aria-pressed', String(cleanMode));
  for (const button of timeButtons) button.setAttribute('aria-pressed', String(button.dataset.time === timeMode));
}

function showError(message) {
  errorText.replaceChildren(h('span', null, message), h('a.atlas-error-return', { href: '../../' }, t('homeLabel')));
  errorText.hidden = false; loader.hidden = true;
  document.body.classList.add('has-error');
}

// ── Scene ─────────────────────────────────────────────────────────────────
let renderer;
try {
  // The final pass draws one full-screen triangle pair; the scene itself is multisampled off screen.
  renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pixelRatio));
}
catch { renderCopy(); showError(t('rendererError')); }

if (renderer) start();

function start() {
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = Q.shadows;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new Scene();
  const camera = new PerspectiveCamera(56, 1, 0.5, 2400);
  camera.layers.enable(LAYER_NO_REFLECTION);
  const sky = createSky({ cloudOctaves: Q.clouds });
  scene.add(sky.mesh);

  const sun = new DirectionalLight(0xffffff, 3);
  const SHADOW = 150;
  if (Q.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
    Object.assign(sun.shadow.camera, { left: -SHADOW, right: SHADOW, top: SHADOW, bottom: -SHADOW, near: 1, far: 1400 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.9;
  }
  const hemi = new HemisphereLight(0xffffff, 0x000000, 1);
  scene.add(sun, sun.target, hemi);

  const reflection = new Reflection({ scale: Q.reflection });
  let land;
  const streamer = createStreamer({ workers: Math.min(Q.workers, Math.max(1, (navigator.hardwareConcurrency || 2) - 1)), onResult: (job, data) => land.onResult(job, data) });
  land = new Land(scene, streamer, { reflection, quality: Q });
  const motes = createMotes(Q.motes), lanterns = createLanterns(), flock = createFlock();
  scene.add(motes.points, lanterns.points, flock.mesh);
  const pipeline = new Pipeline(renderer, { samples: Q.samples, rays: Q.rays });

  const flight = new Flight({ reduced, s: Number(params.get('s')) || 0 });
  const state = sampleTime(hour);
  const forward = new Vector3(), shadowCenter = new Vector3(), right = new Vector3(), upv = new Vector3(), lightDir = new Vector3();
  let lastKey = '', forceRender = true, lastLoadingRender = 0;
  let worldTime = 0, ready = false, readyFrames = 0, startedAt = performance.now(), lastHud = 0, frames = 0, fpsTime = 0, fps = 0, viewport = { width: 1, height: 1 };

  const quality = adaptivePixelRatio(renderer, { min: 1, max: Math.min(devicePixelRatio || 1, Q.pixelRatio), budgetMs: 24, onChange: () => resize(viewport) });
  function resize({ width, height }) {
    viewport = { width, height }; forceRender = true;
    flight.frame(width / height);
    const ratio = renderer.getPixelRatio();
    pipeline.setSize(width, height, ratio);
    reflection.setSize(width * ratio, height * ratio);
    pointScale();
  }
  function pointScale() {
    const pixel = (viewport.height * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    motes.uniforms.uPixel.value = pixel; lanterns.uniforms.uPixel.value = pixel;
  }
  const stopResize = observeSize(renderer, camera, { onResize: resize });

  function applyLight() {
    applyTime(state);
    sun.color.fromArray(state.sun); sun.intensity = state.light;
    hemi.color.fromArray(state.sky); hemi.groundColor.fromArray(state.ground); hemi.intensity = state.fill * 2.4;
    lighting.uKeyLight.value.fromArray(state.sun).multiplyScalar(state.light);
    lighting.uLightDir.value.fromArray(state.lightDir);
    lighting.uSkyFill.value.fromArray(state.sky).multiplyScalar(state.fill * 2.4 / Math.PI);
    lighting.uGroundFill.value.fromArray(state.ground).multiplyScalar(state.fill * 2.4 / Math.PI);
    renderer.toneMappingExposure = state.exposure;
    const weights = landAt(flight.s);
    motes.uniforms.uLand.value.set(weights[0], weights[1], weights[2], weights[3]);
    sky.uniforms.uAurora.value = 0.35 + 0.65 * weights[3];
    sky.uniforms.uClouds.value = 0.4 + 0.1 * weights[1] - 0.08 * weights[2] + 0.06 * weights[3];
  }

  function placeShadow() {
    if (!Q.shadows) return;
    lightDir.fromArray(state.lightDir);
    shadowCenter.copy(camera.position).addScaledVector(forward, SHADOW * 0.55); shadowCenter.y -= 8;
    // Snap to shadow texels so the shadows do not crawl as the camera moves.
    right.crossVectors(lightDir, new Vector3(0, 1, 0)).normalize();
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    upv.crossVectors(right, lightDir).normalize();
    const texel = (2 * SHADOW) / Q.shadowSize, a = shadowCenter.dot(right), b = shadowCenter.dot(upv);
    shadowCenter.addScaledVector(right, Math.round(a / texel) * texel - a).addScaledVector(upv, Math.round(b / texel) * texel - b);
    sun.target.position.copy(shadowCenter);
    sun.position.copy(shadowCenter).addScaledVector(lightDir, 600);
    sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
  }

  function frame(delta) {
    const dt = Math.min(delta, 0.05);
    const live = ready && !paused;
    if (live) worldTime += dt;
    if (live || timeTarget !== null) {
      if (timeTarget !== null) {
        const step = forwardHours(hour, timeTarget), move = Math.min(step, dt * (reduced ? 24 : 3.2));
        hour += move;
        if (step - move < 1e-3) { hour = timeTarget; timeTarget = null; }
      } else if (timeMode === 'flow') hour += dt * HOURS_PER_SECOND;
    }
    sampleTime(hour, state);
    flight.update(ready ? dt : 0, { paused });
    applyLight();

    camera.position.set(flight.position.x, flight.position.y, flight.position.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(flight.target.x, flight.target.y, flight.target.z);
    camera.rotateZ(flight.roll);
    if (Math.abs(camera.fov - flight.fov) > 0.01) { camera.fov = flight.fov; camera.updateProjectionMatrix(); pointScale(); }
    camera.updateMatrixWorld();
    camera.getWorldDirection(forward);

    land.update(camera, forward);
    placeShadow();
    atmosphere.uTime.value = worldTime;
    atmosphere.uWind.value = 1;
    motes.uniforms.uCenter.value.copy(camera.position).addScaledVector(forward, 60);
    lanterns.uniforms.uCenter.value.copy(camera.position).addScaledVector(forward, 380);
    flock.update(flight.s, worldTime, state.night, live ? dt : 0);
    try { ambience.update({ speed: flight.speed, night: state.night, paused }); } catch { /* Sound must never stop the picture. */ }

    // Skip frames that would look identical: paused, settled and nothing new streamed in.
    const key = [flight.s, flight.y, flight.yaw, flight.pitch, flight.roll, camera.fov, hour, land.version].map(v => v.toFixed(4)).join();
    const now = performance.now();
    if (!ready && now - lastLoadingRender < 400 && !forceRender) return;
    if (ready && !live && key === lastKey && !forceRender) return;
    lastKey = key; forceRender = false; lastLoadingRender = now;
    renderer.info.reset();
    renderer.shadowMap.needsUpdate = true;
    reflection.render(renderer, scene, camera);
    pipeline.render(scene, camera, {
      time: worldTime, sunDir: atmosphere.uSunDir.value, sunColor: atmosphere.uSunColor.value,
      rays: (1 - state.night) * 0.5 * state.haze, bloom: 0.26 + state.glow * 0.42 + state.haze * 0.04, speed: reduced ? 0 : flight.fast * 0.9,
    });

    if (!ready) {
      const progress = Math.min(land.tileProgress, land.ready ? 1 : 0.8);
      loaderBar.style.transform = `scaleX(${progress.toFixed(3)})`;
      readyFrames = progress >= 1 && streamer.backlog < 12 ? readyFrames + 1 : 0;
      if (readyFrames > 1 || performance.now() - startedAt > 15000) {
        ready = true;
        document.body.classList.add('ready'); document.body.dataset.ready = 'true';
        loader.classList.add('is-done');
        setTimeout(() => { if (!interacted) hint.classList.add('is-faded'); }, 9000);
        // Open with the name of the land, like a title card.
        if (!params.has('dpr')) setTimeout(() => showBanner(), 1400);
      }
    } else quality.update(delta * 1000);

    frames++; fpsTime += delta;
    if (fpsTime > 1) { fps = Math.round(frames / fpsTime); frames = 0; fpsTime = 0; canvas.dataset.renderStats = JSON.stringify({ fps, tier, s: Math.round(flight.s), hour: Number(hour.toFixed(2)), ...land.stats(), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }); }
    if (now - lastHud > 120) { lastHud = now; updateReadout(); }
  }

  updateReadout = (force = false) => {
    readout.distance.value.textContent = Math.abs(flight.s) < 1000 ? `${Math.round(flight.s)} m` : `${(flight.s / 1000).toFixed(2)} km`;
    readout.speed.value.textContent = `${Math.round(flight.kmh)} km/h`;
    readout.clock.value.textContent = clock(hour);
    const w = landAt(flight.s), top = w.indexOf(Math.max(...w));
    if (top !== currentLand && (w[top] > 0.62 || currentLand < 0)) {
      const announce = currentLand >= 0 && ready;
      currentLand = top;
      if (announce) showBanner();
    }
    if (force || readout.land.value.textContent !== t('lands')[currentLand]) readout.land.value.textContent = t('lands')[currentLand];
  };
  showBanner = () => {
    const name = t('lands')[currentLand];
    banner.replaceChildren(h('span.ev-banner__name', null, name), h('span.ui-eyebrow', null, copy.en.landsLatin[currentLand]));
    banner.setAttribute('aria-label', t('entering')(name));
    if (reduced) {
      banner.classList.add('is-static');
      clearTimeout(showBanner.timer); showBanner.timer = setTimeout(() => banner.classList.remove('is-static'), 3800);
    } else { banner.classList.remove('is-on'); void banner.offsetWidth; banner.classList.add('is-on'); }
  };

  // ── Input ───────────────────────────────────────────────────────────────
  const nudge = amount => { interacted = true; hint.classList.add('is-faded'); if (paused) flight.s += amount * 0.4; else flight.impulse(amount); };
  addEventListener('wheel', event => {
    if (about.open) return;
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    nudge(Math.max(-120, Math.min(120, event.deltaY * scale)) * 0.05);
  }, { passive: false });

  let pointer = null;
  canvas.addEventListener('pointerdown', event => {
    canvas.focus({ preventScroll: true });
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, type: event.pointerType };
    flight.dragging = true; canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer && event.pointerId === pointer.id) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer.x = event.clientX; pointer.y = event.clientY;
      if (pointer.type === 'touch') { flight.drag(dx, 0); nudge(-dy * 0.16); }
      else { flight.drag(dx, dy); interacted = true; hint.classList.add('is-faded'); }
    } else if (event.pointerType === 'mouse' && !reduced) {
      flight.look((event.clientX / innerWidth) * 2 - 1, (event.clientY / innerHeight) * 2 - 1);
    }
  });
  const release = event => { if (pointer && event.pointerId === pointer.id) { pointer = null; flight.dragging = false; } };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  document.addEventListener('pointerleave', () => flight.look(0, 0));

  const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  addEventListener('keydown', event => {
    if (about.open || event.metaKey || event.ctrlKey || event.altKey) return;
    const onControl = event.target.closest?.('button, a, input, select, textarea, [contenteditable]');
    if (KEYS[event.code] && !(onControl && event.code.startsWith('Arrow') && event.target.closest('[role="group"]'))) {
      event.preventDefault(); flight.keys[KEYS[event.code]] = 1; interacted = true; hint.classList.add('is-faded');
      if (paused && (KEYS[event.code] === 'up' || KEYS[event.code] === 'down')) flight.s += KEYS[event.code] === 'up' ? 4 : -4;
      return;
    }
    if (event.code === 'Space' && !onControl) { event.preventDefault(); togglePause(); }
    else if (event.code === 'KeyH') toggleClean();
    else if (event.code === 'KeyM') toggleSound();
    else if (event.code === 'KeyT') chooseTime(TIMES[(TIMES.indexOf(timeMode) + 1) % TIMES.length]);
  });
  addEventListener('keyup', event => { if (KEYS[event.code]) flight.keys[KEYS[event.code]] = 0; });
  addEventListener('blur', () => { for (const key in flight.keys) flight.keys[key] = 0; });

  togglePause = () => {
    paused = !paused;
    if (!paused) flight.autopilot = true;
    hint.textContent = t('hint');
    renderState();
  };
  chooseTime = name => {
    timeMode = name;
    timeTarget = name === 'flow' ? null : PRESETS[name];
    renderState();
  };

  // ── Lifecycle ───────────────────────────────────────────────────────────
  const loop = createLoop(renderer, frame);
  const stopGuard = guardContext(canvas, { onLost: () => loop.setPaused(true), onRestored: () => { quality.reset(); loop.setPaused(false); } });
  loop.start();
  addEventListener('pagehide', event => {
    if (event.persisted) { loop.setPaused(true); ambience.suspend(); return; }
    ambience.dispose();
    loop.dispose(); stopResize(); stopGuard(); streamer.dispose(); land.dispose(); pipeline.dispose(); reflection.dispose();
    for (const object of [sky.mesh, motes.points, lanterns.points, flock.mesh]) { object.geometry.dispose(); object.material.dispose(); }
    renderer.dispose();
  });
  addEventListener('pageshow', event => { if (event.persisted) { loop.setPaused(false); ambience.resume(); } });
  document.addEventListener('visibilitychange', () => (document.hidden ? ambience.suspend() : ambience.resume()));
  window.__endlessVale = { flight, land, get hour() { return hour; }, set hour(value) { hour = value; } };
}

// Placeholders until the scene starts; replaced in start().
function updateReadout() {}
function showBanner() {}
function togglePause() {}
function chooseTime() {}
async function toggleSound() {
  await ambience.toggle();
  renderState();
}
function toggleClean() {
  cleanMode = !cleanMode;
  document.body.classList.toggle('is-clean', cleanMode);
  renderState();
}

onLang(renderCopy);
renderCopy();
