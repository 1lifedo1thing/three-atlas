import '../../../src/ui/tokens.css';
import '../../../src/ui/base.css';
import '../../../src/ui/components/button.css';
import './style.css';
import {
  HalfFloatType, LinearFilter, MathUtils, Matrix4, Mesh, MeshBasicMaterial, NoToneMapping, OrthographicCamera, PerspectiveCamera,
  PlaneGeometry, Scene, ShaderMaterial, SphereGeometry, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { h } from '../../../src/ui/dom.js';
import { Button } from '../../../src/ui/components/button.js';
import { getLang, setLang, onLang, htmlLang } from '../../../src/ui/i18n.js';
import { guardContext } from '../../../src/kit/three/lifecycle.js';
import { copy } from './copy.js';
import { BH_VERT, BH_FRAG, FINAL_FRAG } from './shaders.js';
import {
  TAU, OMK, R_MIN, R_MAX, R_HOME, E_NOW, E_PLANCK, SECONDS_PER_YEAR_LOG, clamp, lerp, smooth, easeInOut,
  gammaAt, shadowAngle, clockMultiplier, epochRate, eraOf, diskHeat, dustDecay, gearDecay, formatClock, formatTau,
} from './physics.js';
import { createClock } from './clock.js';
import { createDust } from './dust.js';
import { createGears } from './gears.js';
import { createMoments } from './moments.js';
import { sound } from './audio.js';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(pointer: coarse)').matches;
const small = Math.min(innerWidth, innerHeight) < 640;
const t = key => copy[getLang()][key] ?? copy.zh[key];
// Controls exist before the scene starts; start() swaps in the live versions.
let toggleFreeze = () => {}, toggleSound = () => {}, dive = () => {};
const rand = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const randn = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

// ── Interface ─────────────────────────────────────────────────────────────
const root = document.querySelector('#app');
const canvas = h('canvas.eot-canvas', { tabindex: '0' });
const back = Button({ label: 'Three Atlas', href: '../../', icon: 'back', variant: 'secondary', size: 'sm', attrs: { class: 'eot-back' } });
const langButtons = ['zh', 'en'].map(code => h('button.eot-chip', { type: 'button', lang: code === 'zh' ? 'zh-CN' : 'en', dataset: { lang: code }, onClick: () => setLang(code) }, code === 'zh' ? '中文' : 'EN'));
const langGroup = h('div.eot-lang', { role: 'group' }, langButtons);
const eyebrow = h('p.ui-eyebrow'), title = h('h1.ui-h2.eot-title', null, 'THE END OF TIME'), subtitle = h('p.eot-subtitle'), lead = h('p.ui-small.eot-lead');
const intro = h('section.eot-intro', null, eyebrow, title, subtitle, lead);
const eraText = h('span.eot-era__name'), aeonText = h('span.eot-era__aeon');
const ageLabel = h('p.ui-eyebrow.eot-age__label');
const expText = h('sup.eot-age__exp'), unitText = h('span.eot-age__unit');
const timelineMark = h('i.eot-timeline__mark');
const timelineNames = [7, 27, 70, 106].map(e => h('span.eot-timeline__name', { style: { left: `${tlX(e)}%` } }));
const timeline = h('div.eot-timeline', { 'aria-hidden': 'true' },
  [[0, '10⁰'], [14, '10¹⁴'], [40, '10⁴⁰'], [100, '10¹⁰⁰']].map(([e, s]) => h('span.eot-timeline__tick', { style: { left: `${tlX(e)}%` } }, s)),
  timelineNames, timelineMark);
const age = h('section.eot-age', null, h('p.eot-era', null, eraText, aeonText), ageLabel, h('p.eot-age__big', null, h('span.eot-age__ten', null, '10'), expText, unitText), timeline);
const readout = {};
const readoutList = h('dl.eot-readout', null, ['distance', 'dilation', 'rate', 'dial', 'tau'].map(key => {
  readout[key] = { label: h('dt'), value: h('dd', { dataset: { readout: key } }) };
  return h('div', { class: key === 'dial' || key === 'tau' ? 'is-wide' : null }, readout[key].label, readout[key].value);
}));
const freezeButton = Button({ label: '', variant: 'secondary', size: 'sm', icon: null, attrs: { id: 'freeze', 'aria-pressed': 'false' }, onClick: () => toggleFreeze() });
const diveButton = Button({ label: '', variant: 'secondary', size: 'sm', icon: null, attrs: { id: 'dive' }, onClick: () => dive() });
const soundButton = Button({ label: '', variant: 'ghost', size: 'sm', icon: null, attrs: { id: 'sound', 'aria-pressed': 'false' }, onClick: () => toggleSound() });
const aboutButton = Button({ label: '', variant: 'ghost', size: 'sm', icon: 'external', attrs: { id: 'about' }, onClick: () => about.showModal() });
const gaugeMark = h('i.eot-gauge__mark'), gaugeValue = h('span.eot-gauge__value');
const gaugeLabels = { isco: h('span.eot-gauge__label'), photon: h('span.eot-gauge__label'), horizon: h('span.eot-gauge__label.is-horizon') };
const gauge = h('aside.eot-gauge', { 'aria-hidden': 'true' }, h('i.eot-gauge__rail'),
  [['isco', 3], ['photon', 1.5], ['horizon', 1]].map(([key, r]) => { gaugeLabels[key].style.top = `${gaugeY(r)}%`; return gaugeLabels[key]; }), gaugeMark, gaugeValue);
const hint = h('p.eot-hint');
const notice = h('p.eot-notice', { role: 'status' });
const labels = h('div.eot-labels', { 'aria-hidden': 'true' });
const finaleTitle = h('h2.ui-h1'), finaleLine = h('p.ui-lead'), finaleNext = h('p.ui-small');
const finale = h('div.eot-finale', { 'aria-live': 'polite' }, h('div', null, finaleTitle, finaleLine, finaleNext));
const loaderText = h('p.ui-eyebrow');
const loader = h('div.eot-loader', { role: 'status' }, loaderText);
const aboutTitle = h('h2.ui-h3'), aboutBody = h('div.eot-about__body'), aboutKeys = h('p.eot-about__keys');
const aboutClose = Button({ label: '', variant: 'secondary', size: 'sm', icon: null, onClick: () => about.close() });
const about = h('dialog.eot-about', null, aboutTitle, aboutBody, aboutKeys, aboutClose);
about.addEventListener('click', event => { if (event.target === about) about.close(); });
const errorText = h('p.eot-error', { role: 'alert', hidden: true });

root.append(canvas, labels, h('div.eot-scrim', { 'aria-hidden': 'true' }),
  h('header.eot-top', null, back, langGroup), intro, hint, notice, gauge, age,
  h('footer.eot-bottom', null, readoutList, h('div.eot-actions', null, freezeButton, diveButton, soundButton, aboutButton)),
  finale, loader, errorText, about);

function tlX(E) { return clamp(E / 110, 0, 1) * 100; }
function gaugeY(r) { return clamp((Math.log(R_MAX) - Math.log(r)) / Math.log(R_MAX), 0, 1) * 100; }

let noticeKey = null, noticeTimer = 0;
function say(key, seconds = 6) {
  noticeKey = key; noticeTimer = seconds;
  notice.innerHTML = t('notices')[key];
  notice.classList.add('is-on');
}
function renderCopy() {
  document.documentElement.lang = htmlLang();
  document.title = t('pageTitle');
  back.setAttribute('aria-label', t('homeLabel'));
  langGroup.setAttribute('aria-label', t('languageLabel'));
  for (const button of langButtons) button.setAttribute('aria-pressed', String(button.dataset.lang === getLang()));
  eyebrow.textContent = t('eyebrow'); subtitle.textContent = t('subtitle'); lead.textContent = t('lead');
  canvas.setAttribute('aria-label', t('canvasLabel'));
  hint.textContent = touch ? t('hintTouch') : t('hint');
  ageLabel.textContent = t('age');
  t('timeline').forEach((name, i) => { timelineNames[i].textContent = name; });
  for (const key of Object.keys(readout)) readout[key].label.textContent = t(key);
  for (const key of Object.keys(gaugeLabels)) gaugeLabels[key].textContent = t('gauge')[key];
  diveButton.querySelector('.ui-btn__label').textContent = t('dive');
  diveButton.setAttribute('aria-label', t('diveLabel'));
  aboutButton.querySelector('.ui-btn__label').textContent = t('about');
  aboutTitle.textContent = t('aboutTitle');
  aboutBody.replaceChildren(...t('aboutBody').map(text => h('p', null, text)));
  aboutKeys.textContent = t('shortcuts');
  aboutClose.querySelector('.ui-btn__label').textContent = t('closeAbout');
  finaleTitle.textContent = t('finaleTitle'); finaleLine.textContent = t('finaleLine'); finaleNext.textContent = t('finaleNext');
  loaderText.textContent = t('loading');
  if (noticeKey && notice.classList.contains('is-on')) notice.innerHTML = t('notices')[noticeKey];
  clock?.setInscription(t('inscription'));
  lastEra = null;
  renderState();
}
function renderState() {
  const frozen = S.tsTarget < 0.5;
  freezeButton.querySelector('.ui-btn__label').textContent = t(frozen ? 'unfreeze' : 'freeze');
  freezeButton.setAttribute('aria-label', t(frozen ? 'unfreezeLabel' : 'freezeLabel'));
  freezeButton.setAttribute('aria-pressed', String(frozen));
  soundButton.querySelector('.ui-btn__label').textContent = t(sound.on ? 'soundOff' : 'sound');
  soundButton.setAttribute('aria-label', t(sound.on ? 'soundOffLabel' : 'soundLabel'));
  soundButton.setAttribute('aria-pressed', String(sound.on));
}
function showError(message) {
  errorText.replaceChildren(h('span', null, message), h('a.atlas-error-return', { href: '../../' }, t('homeLabel')));
  errorText.hidden = false; loader.hidden = true;
  document.body.classList.add('has-error');
}

// ── State ─────────────────────────────────────────────────────────────────
const now0 = new Date();
const S = {
  phase: 'live', phaseT: 0, sim: 0, diskT: 0, spinT: 0, ts: reduced ? 0 : 1, tsTarget: reduced ? 0 : 1,
  E: E_NOW, clock: now0.getHours() * 3600 + now0.getMinutes() * 60 + now0.getSeconds(), tau: 0,
  aeon: 1, birth: 0, white: 0, reveal: 1, appear: 1, resetDone: false,
  theta: 0.42, phi: 1.405, logR: Math.log(R_HOME), tTheta: 0.42, tPhi: 1.405, tLogR: Math.log(R_HOME),
  push: 0, autoDive: false, lastInput: -10, look: 0, mx: 0, my: 0, pmx: 0, pmy: 0,
  gamma: 1, mult: 1, R: R_HOME, notices: new Set(), interacted: false, fallFrom: R_HOME,
};
let clock = null, lastEra = null;

// ── Renderer ──────────────────────────────────────────────────────────────
let renderer;
try { renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); }
catch { renderCopy(); showError(t('rendererError')); }
if (renderer) start().catch(error => { console.error(error); showError(t('rendererError')); });

async function start() {
  renderCopy();
  onLang(renderCopy);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = NoToneMapping;

  // Quality levels: pixel ratio and the resolution of the ray-traced layer, which costs the most.
  const LEVELS = [{ pr: 0.6, bh: 0.5 }, { pr: 0.8, bh: 0.55 }, { pr: 1.0, bh: 0.6 }, { pr: 1.0, bh: 0.75 }, { pr: 1.25, bh: 0.75 }, { pr: 1.5, bh: 0.75 }, { pr: 2.0, bh: 0.7 }];
  const dpr = devicePixelRatio || 1;
  const maxLevel = dpr >= 2 ? (small ? 4 : 6) : dpr >= 1.5 ? 5 : 3;
  const locked = params.has('q');
  let level = locked ? clamp(Number(params.get('q')) || 0, 0, LEVELS.length - 1) : Math.min(maxLevel, small ? 3 : 4);

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, innerWidth / innerHeight, 0.02, 3000);
  const U = { camPos: { value: new Vector3() }, lens: { value: 1 }, res: { value: new Vector2(1, 1) }, px: { value: 600 } };

  const bhTarget = new WebGLRenderTarget(4, 4, { type: HalfFloatType, depthBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter });
  const bhScene = new Scene(), bhCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bhMat = new ShaderMaterial({
    vertexShader: BH_VERT, fragmentShader: BH_FRAG, depthTest: false, depthWrite: false,
    uniforms: {
      uInvProj: { value: new Matrix4() }, uCamWorld: { value: new Matrix4() }, uCamPos: { value: new Vector3() },
      uTime: { value: 0 }, uEpoch: { value: E_NOW }, uHeat: { value: 1 }, uDiskGlow: { value: 1 }, uGCam: { value: 1 },
      uCamR: { value: R_HOME }, uBirth: { value: 0 }, uPix: { value: 0.001 }, uGlow: { value: 0.32 }, uOmK: { value: OMK },
    },
  });
  bhScene.add(new Mesh(new PlaneGeometry(2, 2), bhMat));
  // The traced image is drawn as the scene background; a depth-only sphere hides what is physically behind the shadow.
  const background = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms: { tBH: { value: bhTarget.texture } }, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: 'uniform sampler2D tBH; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tBH, vUv).rgb, 1.0); }',
  }));
  background.frustumCulled = false; background.renderOrder = -100;
  const occluder = new Mesh(new SphereGeometry(2.6, 48, 32), new MeshBasicMaterial({ colorWrite: false }));
  occluder.renderOrder = -50;
  scene.add(background, occluder);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.55, 0.42, 0.78);
  composer.addPass(bloom);
  const finalPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uRes: { value: new Vector2(1, 1) }, uTime: { value: 0 }, uFreeze: { value: 0 }, uWhite: { value: 0 }, uDive: { value: 0 }, uExposure: { value: 1 }, uGrain: { value: 0.035 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: FINAL_FRAG,
  });
  composer.addPass(finalPass);

  // Canvas textures are typeset with Geist, so wait briefly for the font.
  await Promise.race([document.fonts.load('250 64px "Geist Variable"').catch(() => {}), new Promise(r => setTimeout(r, 2000))]);
  clock = createClock(U, { inscriptionText: t('inscription') });
  scene.add(clock.group);
  const dust = createDust(U, small ? 60000 : 140000, rand, randn);
  scene.add(dust.points);
  const gears = createGears({ renderer, scene, U, dialRotation: clock.group.rotation, small, rand, randn });
  const moments = createMoments(U, labels);
  scene.add(moments.points);

  function applySize() {
    const W = innerWidth, H = innerHeight, L = LEVELS[level], pr = Math.min(L.pr, dpr * 1.0001);
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    composer.setPixelRatio(pr); composer.setSize(W, H);
    camera.aspect = W / H;
    camera.fov = W / H < 0.8 ? 56 : 42;
    if (W > 900) camera.setViewOffset(W, H, -W * 0.035, 0, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const bw = Math.max(64, Math.round(W * pr * L.bh)), bh = Math.max(64, Math.round(H * pr * L.bh));
    bhTarget.setSize(bw, bh);
    bhMat.uniforms.uPix.value = (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / bh;
    U.res.value.set(W * pr, H * pr);
    U.px.value = (H * pr * 0.5) / Math.tan(MathUtils.degToRad(camera.fov) / 2);
    finalPass.uniforms.uRes.value.set(W * pr, H * pr);
    canvas.dataset.quality = String(level);
  }
  addEventListener('resize', applySize);
  applySize();
  let perfAcc = 0, perfN = 0, perfHold = 0;
  function adapt(dt) {
    if (locked || document.hidden) return;
    perfAcc += dt; perfN++; perfHold -= dt;
    if (perfAcc < 2) return;
    const avg = perfAcc / perfN; perfAcc = 0; perfN = 0;
    if (avg > 1 / 38 && level > 0) { level--; perfHold = 12; applySize(); }
    else if (avg < 1 / 58 && level < maxLevel && perfHold <= 0) { level++; perfHold = 6; applySize(); }
  }

  // ── Input ───────────────────────────────────────────────────────────────
  const pointers = new Map();
  let pinch0 = 0, down = null;
  const inputOK = () => S.phase === 'live' || (S.phase === 'rebirth' && S.phaseT > 2.5);
  const touched = () => {
    S.lastInput = performance.now() / 1000;
    if (!S.interacted) { S.interacted = true; intro.classList.add('is-faded'); hint.classList.add('is-faded'); }
  };
  canvas.addEventListener('pointerdown', event => {
    canvas.focus({ preventScroll: true });
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) down = { x: event.clientX, y: event.clientY, t: performance.now(), moved: 0 };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); down = null; }
  });
  canvas.addEventListener('pointermove', event => {
    S.mx = (event.clientX / innerWidth) * 2 - 1; S.my = (event.clientY / innerHeight) * 2 - 1;
    const p = pointers.get(event.pointerId);
    if (!p) return;
    const dx = event.clientX - p.x, dy = event.clientY - p.y;
    p.x = event.clientX; p.y = event.clientY;
    if (!inputOK()) return;
    if (pointers.size === 1) {
      const k = 0.0052 * (touch ? 1.2 : 1);
      S.tTheta -= dx * k; S.tPhi = clamp(S.tPhi - dy * k, 0.12, Math.PI - 0.12);
      if (down) down.moved += Math.abs(dx) + Math.abs(dy);
      if (down?.moved > 8) touched();
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0 > 0) zoomBy(Math.log(pinch0 / d) * 1.4);
      pinch0 = d;
    }
  });
  const release = event => {
    pointers.delete(event.pointerId);
    if (down && pointers.size === 0 && event.type === 'pointerup' && down.moved < 8 && performance.now() - down.t < 400 && inputOK()) throwMoment(event.clientX, event.clientY);
    if (pointers.size === 0) down = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    if (!inputOK()) return;
    zoomBy(event.deltaY * (event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? 400 : 1) * 0.0011);
  }, { passive: false });
  function zoomBy(d) {
    touched();
    if (d > 0) { S.autoDive = false; S.push = 0; }
    const minL = Math.log(R_MIN);
    if (S.tLogR <= minL + 0.002 && d < 0) { S.push -= d; if (S.push > 0.6) startFall(); }
    // the last stretch above the horizon feels heavy
    const k = d < 0 ? clamp((Math.exp(S.tLogR) - 1) / 1.2, 0.08, 1) : 1;
    S.tLogR = clamp(S.tLogR + d * k, minL, Math.log(R_MAX));
  }
  addEventListener('keydown', event => {
    if (about.open || event.target.closest?.('button, a, input') && ['Space', 'Enter'].includes(event.code)) return;
    const k = 0.08;
    switch (event.code) {
      case 'Space': event.preventDefault(); toggleFreeze(); break;
      case 'ArrowLeft': S.tTheta += k; break;
      case 'ArrowRight': S.tTheta -= k; break;
      case 'ArrowUp': event.preventDefault(); S.tPhi = clamp(S.tPhi - k, 0.12, Math.PI - 0.12); break;
      case 'ArrowDown': event.preventDefault(); S.tPhi = clamp(S.tPhi + k, 0.12, Math.PI - 0.12); break;
      case 'KeyW': case 'Equal': case 'NumpadAdd': if (inputOK()) zoomBy(-0.12); break;
      case 'KeyS': case 'Minus': case 'NumpadSubtract': if (inputOK()) zoomBy(0.12); break;
      case 'KeyF': dive(); break;
      case 'KeyM': toggleSound(); break;
      case 'KeyC': if (inputOK()) throwMoment(innerWidth * (0.3 + rand() * 0.4), innerHeight * (0.3 + rand() * 0.4)); break;
      default: return;
    }
    touched();
  });
  const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
  let phraseIndex = Math.floor(rand() * 18);
  function throwMoment(x, y) {
    const phrases = t('phrases');
    moments.spawn(camera, x, y, phrases[phraseIndex++ % phrases.length], `t = ${formatClock(S.clock)}`);
    sound.chime(PENTA[Math.floor(clamp(x / innerWidth, 0, 0.999) * PENTA.length)]);
    if (!S.notices.has('moment')) { S.notices.add('moment'); say('moment'); }
    touched();
  }
  toggleFreeze = () => {
    S.tsTarget = S.tsTarget > 0.5 ? 0 : 1;
    if (S.tsTarget < 0.5 && !S.notices.has('freeze')) { S.notices.add('freeze'); say('freeze', 4.5); }
    renderState();
  };
  toggleSound = () => { sound.enable(!sound.on); renderState(); };
  dive = () => { if (!inputOK()) return; S.autoDive = true; S.push = 0; touched(); };

  // ── Phases: live → falling → white → rebirth → live ─────────────────────
  function startFall() {
    if (S.phase !== 'live' && S.phase !== 'rebirth') return;
    Object.assign(S, { phase: 'falling', phaseT: 0, autoDive: false, tsTarget: 1, resetDone: false, fallFrom: Math.exp(S.logR) });
    notice.classList.remove('is-on');
    sound.riser(3.4);
    renderState();
  }
  function resetUniverse() {
    S.aeon += 1; S.E = E_PLANCK;
    S.theta = S.tTheta = 0.42 + rand() * 1.2; S.phi = S.tPhi = 1.36 + rand() * 0.08;
    S.logR = Math.log(R_MAX * 0.8); S.tLogR = Math.log(R_HOME);
    Object.assign(S, { look: 0, birth: 1, reveal: 0, appear: 0, push: 0, notices: new Set(['near', 'moment', 'freeze']) });
    moments.clear();
  }

  // ── Frame ───────────────────────────────────────────────────────────────
  const look = new Vector3(), hDir = new Vector3(), tUp = new Vector3(), right = new Vector3();
  const MESSAGES = [
    ['near', () => S.R < 7], ['stars', () => S.E > 14], ['decay', () => S.E > 36], ['bh', () => S.E > 100],
    ['edge', () => S.tLogR <= Math.log(R_MIN) + 0.002],
  ];
  let hudAcc = 0;
  function update(dt) {
    const now = performance.now() / 1000;
    S.phaseT += dt;
    if (S.phase === 'live') {
      if (S.autoDive) {
        S.tLogR = Math.max(Math.log(R_MIN), S.tLogR - dt * 0.34 * clamp((Math.exp(S.tLogR) - 1) / 1.5, 0.12, 1));
        if (S.tLogR <= Math.log(R_MIN) + 1e-4 && S.logR < Math.log(R_MIN) + 0.01) startFall();
      }
      if (now - S.lastInput > 6 && !reduced && !S.autoDive) S.tTheta += dt * 0.022;
      S.reveal = Math.min(1, S.reveal + dt / 4.5);
      S.appear = Math.min(1, S.appear + dt / 3.5);
    } else if (S.phase === 'falling') {
      const e = easeInOut(Math.min(S.phaseT / 3.4, 1));
      S.logR = S.tLogR = Math.log(1 + (S.fallFrom - 1) * Math.pow(0.00035 / (S.fallFrom - 1), e));
      S.look = easeInOut(clamp(S.phaseT / 2, 0, 1));
      S.white = smooth(2.6, 3.4, S.phaseT);
      if (S.phaseT > 3.4) { S.phase = 'white'; S.phaseT = 0; S.white = 1; finale.classList.add('is-on'); root.classList.add('is-finale'); }
    } else if (S.phase === 'white') {
      S.white = 1;
      if (S.phaseT > 0.4 && !S.resetDone) { S.resetDone = true; resetUniverse(); }
      if (S.phaseT > 3.6) { S.phase = 'rebirth'; S.phaseT = 0; sound.rebirth(); }
    } else if (S.phase === 'rebirth') {
      const p = S.phaseT;
      S.white = 1 - smooth(0, 2.2, p);
      if (p > 1.6) finale.classList.remove('is-on');
      if (p > 2.4) root.classList.remove('is-finale');
      S.birth = 1 - smooth(0.2, 6.5, p);
      S.E = lerp(E_PLANCK, E_NOW, 1 - Math.pow(1 - smooth(0, 7.5, p), 3));
      S.reveal = smooth(3, 7.5, p); S.appear = smooth(2, 6, p);
      if (p > 8) Object.assign(S, { phase: 'live', phaseT: 0, birth: 0, E: E_NOW, lastInput: now, reveal: 1, appear: 1 });
    }

    // camera
    const k = 1 - Math.exp(-dt * (S.phase === 'falling' ? 30 : 4.2));
    S.theta += (S.tTheta - S.theta) * k; S.phi += (S.tPhi - S.phi) * k;
    S.logR += (S.tLogR - S.logR) * (1 - Math.exp(-dt * 2.6));
    const R = (S.R = Math.exp(S.logR)), sp = Math.sin(S.phi);
    camera.position.set(R * sp * Math.sin(S.theta), R * Math.cos(S.phi), R * sp * Math.cos(S.theta));
    S.pmx += (S.mx - S.pmx) * (1 - Math.exp(-dt * 2)); S.pmy += (S.my - S.pmy) * (1 - Math.exp(-dt * 2));
    // Deep in the well the shadow swallows most of the sky, so the view tilts away from the hole by the
    // shadow's angular radius to keep its edge in frame; at the horizon it faces straight out.
    hDir.copy(camera.position).multiplyScalar(-1 / R);
    tUp.set(0, 1, 0).addScaledVector(hDir, -hDir.y);
    if (tUp.lengthSq() < 1e-4) tUp.set(Math.cos(S.theta), 0, -Math.sin(S.theta)).cross(hDir);
    tUp.normalize();
    const halfFov = MathUtils.degToRad(camera.fov) / 2;
    const tilt = lerp(clamp(shadowAngle(R) + 0.1 - halfFov * 0.62, 0, Math.PI) * smooth(9, 5, R), Math.PI * 0.97, S.look);
    const par = reduced ? 0 : 0.04 * (1 - smooth(5, 2, R));
    right.crossVectors(hDir, tUp);
    look.copy(hDir).multiplyScalar(Math.cos(tilt)).addScaledVector(tUp, Math.sin(tilt)).addScaledVector(right, S.pmx * par).addScaledVector(tUp, -S.pmy * par * 0.6);
    camera.up.copy(hDir).multiplyScalar(-Math.sin(tilt)).addScaledVector(tUp, Math.cos(tilt));
    camera.lookAt(look.add(camera.position));
    camera.updateMatrixWorld();

    // relativity
    const g = (S.gamma = gammaAt(R));
    S.mult = clockMultiplier(R);
    S.ts += (S.tsTarget - S.ts) * (1 - Math.exp(-dt * 3.5));
    const sdt = dt * S.ts;
    S.tau += dt;
    if (S.phase === 'live' || S.phase === 'falling') S.E = Math.min(S.E + sdt * epochRate(R), 1e6);
    const prevSec = Math.floor(S.clock);
    S.clock += sdt * S.mult;
    if (Math.floor(S.clock) !== prevSec && S.mult < 18) sound.tick(Math.floor(S.clock) % 60 === 0);
    S.sim += sdt;
    S.diskT += sdt * Math.pow(Math.min(S.mult, 20), 0.35);
    S.spinT += sdt * Math.pow(Math.min(S.mult, 60), 0.75);

    const E = S.E, heat = diskHeat(E) * (S.phase === 'rebirth' ? smooth(0.5, 5, S.phaseT) : 1);
    U.camPos.value.copy(camera.position);
    U.lens.value = smooth(2.2, 4.5, R);
    const fade3 = smooth(1.35, 2.8, R);
    const bu = bhMat.uniforms;
    bu.uInvProj.value.copy(camera.projectionMatrixInverse); bu.uCamWorld.value.copy(camera.matrixWorld); bu.uCamPos.value.copy(camera.position);
    bu.uTime.value = S.diskT; bu.uEpoch.value = Math.min(E, 200); bu.uHeat.value = heat; bu.uDiskGlow.value = Math.pow(heat, 1.6);
    bu.uGCam.value = g; bu.uCamR.value = R; bu.uBirth.value = S.birth;
    bu.uGlow.value = 0.32 * (0.2 + 0.8 * heat) + (E > 100 ? 0.05 : 0);
    occluder.scale.setScalar(Math.min(1, (R * 0.8) / 2.6));
    dust.material.uniforms.uTime.value = S.sim + 900;
    dust.material.uniforms.uDecay.value = dustDecay(E);
    dust.material.uniforms.uBirth.value = S.birth;
    dust.material.uniforms.uHeat.value = heat;
    dust.material.uniforms.uFade.value = fade3;

    // the outside clock, seen from deep in the well, runs fast
    const sec = S.mult < 6 ? ((Math.floor(S.clock) + Math.sqrt(Math.min(1, (S.clock % 1) / 0.14))) / 60) * TAU : (S.clock / 60) * TAU;
    clock.update({
      sec, min: (S.clock / 3600) * TAU, hour: (S.clock / 43200) * TAU, angV: (TAU / 60) * S.mult * S.ts,
      reveal: S.reveal, dim: fade3 * (S.phase === 'white' ? 0 : 1), heat, racing: S.mult >= 30,
    });
    gears.decay.value = gearDecay(E);
    gears.update(camera, S.sim, S.spinT, S.appear * (R > 2 ? 1 : 0));
    gears.light.intensity = 48 * Math.pow(heat, 1.3) + 2;
    gears.light.color.setRGB(1, lerp(0.35, 0.72, heat), lerp(0.12, 0.42, heat));
    gears.hemi.intensity = 0.35 * smooth(14.5, 10.5, E) + 0.06;
    moments.update(camera, sdt, dt, t('frozen'));

    const fu = finalPass.uniforms;
    fu.uTime.value = now; fu.uFreeze.value = 1 - S.ts; fu.uWhite.value = S.white; fu.uDive.value = smooth(6, 1.2, R);
    fu.uExposure.value = Math.pow(g, -1.7) * (S.phase === 'falling' ? lerp(1, 6, smooth(1.2, 3, S.phaseT)) : 1);
    bloom.strength = 0.55 + smooth(4, 1.2, R) * 0.45;

    if (noticeTimer > 0 && (noticeTimer -= dt) <= 0) notice.classList.remove('is-on');
    if (S.phase === 'live') {
      for (const [key, test] of MESSAGES) if (!S.notices.has(key) && test()) { S.notices.add(key); say(key, key === 'edge' ? 4 : 6); break; }
      if (S.tLogR > Math.log(R_MIN) + 0.02) S.notices.delete('edge');
    }
    sound.update(smooth(Math.log(R_MAX), 0, Math.log(R)), 1 - S.ts, S.mult);
    hudAcc += dt;
    if (hudAcc >= 0.05) { hudAcc = 0; updateHUD(); }
  }

  function updateHUD() {
    const E = S.E, inf = (S.phase === 'falling' && E > 300) || S.phase === 'white';
    if (inf) { expText.textContent = '∞'; unitText.textContent = t('years'); }
    else if (E < -7.5) { expText.textContent = (E + SECONDS_PER_YEAR_LOG).toFixed(2); unitText.textContent = t('seconds'); }
    else { expText.textContent = E.toFixed(E > 999 ? 0 : 2); unitText.textContent = t('years'); }
    const era = eraOf(E);
    if (era !== lastEra) { eraText.textContent = t('eras')[era]; lastEra = era; }
    aeonText.textContent = t('aeon')(S.aeon);
    timelineMark.style.left = `${tlX(E)}%`;
    readout.distance.value.textContent = `${S.R < 1.1 ? S.R.toFixed(4) : S.R.toFixed(2)} rₛ`;
    readout.dilation.value.textContent = (1 / S.gamma).toFixed(S.R < 1.1 ? 4 : 3);
    readout.rate.value.textContent = `×${S.mult < 1000 ? S.mult.toFixed(S.mult < 10 ? 2 : 0) : S.mult.toExponential(1).replace('e+', 'e')}`;
    readout.dial.value.textContent = formatClock(S.clock);
    readout.tau.value.textContent = formatTau(S.tau);
    gaugeMark.style.top = gaugeValue.style.top = `${gaugeY(S.R)}%`;
    gaugeValue.textContent = `${S.R.toFixed(S.R < 1.1 ? 3 : 1)} rₛ`;
  }

  function render() {
    renderer.setRenderTarget(bhTarget);
    renderer.render(bhScene, bhCam);
    renderer.setRenderTarget(null);
    composer.render();
  }

  let running = true, last = performance.now(), raf = 0;
  const frame = time => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.0001, (time - last) / 1000));
    last = time;
    update(dt); render(); adapt(dt);
  };
  const resume = () => { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
  const pause = () => { running = false; cancelAnimationFrame(raf); };
  guardContext(canvas, { onLost: pause, onRestored: () => { applySize(); resume(); } });
  addEventListener('pageshow', event => { if (event.persisted) resume(); });
  addEventListener('pagehide', pause);

  update(1 / 60);
  renderer.compile(scene, camera);
  render();
  loader.classList.add('is-done');
  document.body.classList.add('ready');
  if (reduced) say('freeze', 4.5);
  else setTimeout(() => { if (!S.interacted) say(touch ? 'startTouch' : 'start'); }, 2600);

  if (params.has('manual')) {
    running = false;
    // Test hook: advance the simulation deterministically and render on demand (software GL is too slow for a live loop).
    window.__eot = { S, advance: (sec, fps = 30) => { for (let s = 0; s < sec; s += 1 / fps) update(1 / fps); }, draw: render, throwMoment, startFall, setR: r => { S.logR = S.tLogR = Math.log(r); } };
  } else raf = requestAnimationFrame(frame);
}
