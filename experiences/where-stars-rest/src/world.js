import {
  ACESFilmicToneMapping, Color, DirectionalLight, FogExp2, Group,
  HalfFloatType, HemisphereLight, PCFShadowMap, PerspectiveCamera,
  PointLight, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { createIsland } from './island.js';
import { createTree } from './tree.js';
import { createAtmosphere } from './atmosphere.js';
import { createLightRig } from './light-rig.js';
import { sampleBreathing } from './math.js';

export async function createWorld(canvas, { reducedMotion, onInteraction, glow = .55 }) {
  const compact = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const scene = new Scene();
  scene.background = new Color('#070b19');
  scene.fog = new FogExp2('#10152e', .017);
  const time = { value: 0 };
  const breath = { value: reducedMotion ? .5 : sampleBreathing(0) };
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.info.autoReset = false;

  const camera = new PerspectiveCamera(36, 1, .1, 140);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .055;
  controls.enablePan = false;
  controls.minPolarAngle = .48;
  controls.maxPolarAngle = 1.47;
  controls.rotateSpeed = .48;
  controls.zoomSpeed = .65;
  controls.addEventListener('start', onInteraction);

  scene.add(new HemisphereLight('#96a5ec', '#1d142f', 1.45));
  const moon = new DirectionalLight('#b0d9f7', 2.2);
  moon.position.set(-3.5, 7, 5);
  moon.castShadow = true;
  moon.shadow.mapSize.setScalar(compact ? 1024 : 2048);
  moon.shadow.camera.left = -6; moon.shadow.camera.right = 6;
  moon.shadow.camera.top = 7; moon.shadow.camera.bottom = -5;
  moon.shadow.camera.near = .5; moon.shadow.camera.far = 22;
  moon.shadow.bias = -.00025; moon.shadow.normalBias = .025;
  moon.shadow.radius = 3;
  scene.add(moon);
  const rim = new DirectionalLight('#aa85ed', 2.2);
  rim.position.set(3, 4, -5); scene.add(rim);
  const fill = new DirectionalLight('#6a83bf', 1.2);
  fill.position.set(-4, -1, -2); scene.add(fill);

  const floating = new Group();
  floating.rotation.y = -.15;
  scene.add(floating);
  const island = createIsland({ time, compact }), tree = createTree({ time, compact, breath });
  floating.add(island.group, tree.group);
  const treeLight = new PointLight('#b56cff', 2 + glow * 5, 7, 2);
  treeLight.position.set(-.22, 2.7, -.18); floating.add(treeLight);
  const cyanLight = new PointLight('#8ab5ee', 5, 5.5, 2);
  cyanLight.position.set(-1.6, .85, 1.25); floating.add(cyanLight);
  const lightRig = createLightRig(time, breath);
  floating.add(lightRig.group);
  const topSourceView = new Vector3();
  const atmosphere = createAtmosphere({ time, compact, pixelRatio: 1, breath });
  scene.add(atmosphere.space); floating.add(atmosphere.local);

  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: true });
  const composer = new EffectComposer(renderer, target);
  const render = new RenderPass(scene, camera); composer.addPass(render);
  const ao = new GTAOPass(scene, camera, 512, 512);
  ao.blendIntensity = .55;
  ao.updateGtaoMaterial({ radius: .34, thickness: .75, distanceExponent: 1.5, distanceFallOff: 1, scale: 1 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 1.5, normalPhi: 3, radius: 4, rings: 2, samples: 12 });
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), .08 + glow * .95, .65, .6);
  composer.addPass(bloom);
  const output = new OutputPass(); composer.addPass(output);
  const fxaa = new ShaderPass(FXAAShader); composer.addPass(fxaa);

  let width = 1, height = 1, pixelRatio = 1, resolutionScale = 1;
  let fitDistance = 16, running = true, disposed = false, autoRotate = !reducedMotion;
  let dragging = false, returning = false, pulseStart = -100;
  let glowTarget = glow, glowLevel = glow;
  const pointer = new Vector2(), parallax = new Vector2(), zero = new Vector2();
  const homePosition = new Vector3(), homeTarget = new Vector3();
  const direction = new Vector3(.52, .34, .785).normalize();
  let previousFrame = performance.now();
  let raf = 0, t = 0, frames = 0, measureTime = 0, measureFrames = 0, lastAdjust = 0, rotation = -.15;

  function setResolution() {
    pixelRatio = Math.min(devicePixelRatio || 1, compact ? 1.65 : 1.65, Math.sqrt(1_850_000 / (width * height))) * resolutionScale;
    renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio); composer.setSize(width, height);
    // Screen-space occlusion runs at half resolution; the denoiser handles its edge transitions.
    ao.setSize(Math.max(1, Math.round(width * pixelRatio * .5)), Math.max(1, Math.round(height * pixelRatio * .5)));
    fxaa.material.uniforms.resolution.value.set(1 / (width * pixelRatio), 1 / (height * pixelRatio));
    atmosphere.setPixelRatio(pixelRatio, height);
    lightRig.setViewport(height * pixelRatio);
    canvas.dataset.renderScale = pixelRatio.toFixed(2);
  }

  function resize(initial = false) {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width)); height = Math.max(1, Math.round(rect.height));
    const portrait = width / height < .85;
    const previousFit = fitDistance;
    camera.aspect = width / height; camera.fov = portrait ? 40 : 36;
    const viewHeight = Math.max(height < 580 && !portrait ? 11.4 : 10.5, 8.15 / camera.aspect);
    fitDistance = viewHeight / (2 * Math.tan(camera.fov * Math.PI / 360));
    homeTarget.set(0, portrait ? .16 : .7, 0);
    homePosition.copy(direction).multiplyScalar(fitDistance).add(homeTarget);
    if (initial) {
      controls.target.copy(homeTarget); camera.position.copy(homePosition);
    } else {
      camera.position.sub(controls.target).multiplyScalar(fitDistance / previousFit).add(controls.target);
      controls.target.y = homeTarget.y;
    }
    controls.minDistance = fitDistance * .65; controls.maxDistance = fitDistance * 1.45;
    camera.updateProjectionMatrix(); controls.update(); setResolution();
  }
  resize(true);

  controls.addEventListener('start', () => { dragging = true; returning = false; });
  controls.addEventListener('end', () => { dragging = false; });

  function reset() {
    // One update consumes residual OrbitControls velocity before the camera eases home.
    controls.enableDamping = false; controls.update(); controls.enableDamping = true;
    returning = !reducedMotion; rotation = -.15;
    if (reducedMotion) { camera.position.copy(homePosition); controls.target.copy(homeTarget); }
    pointer.set(0, 0);
  }

  function animate() {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    if (!running) return;
    const now = performance.now();
    const elapsed = (now - previousFrame) / 1000;
    previousFrame = now;
    const dt = Math.min(elapsed, .05);
    if (!reducedMotion) t += dt;
    time.value = t;
    breath.value = reducedMotion ? .5 : sampleBreathing(t);
    if (autoRotate && !dragging && !returning) rotation += dt * .021;
    floating.rotation.y = rotation;
    floating.position.y = reducedMotion ? 0 : Math.sin(t * .49) * .055;
    const pulse = Math.max(0, 1 - (t - pulseStart) / 3.4) * Math.max(0, Math.sin((t - pulseStart) * Math.PI / 3.4));
    glowLevel += (glowTarget - glowLevel) * (1 - Math.exp(-dt * 8));
    island.update(t); tree.update(t, pulse, glowLevel); lightRig.update(t, glowLevel);
    treeLight.intensity = (2 + glowLevel * (5 + pulse * 2)) * (.72 + .45 * breath.value);
    bloom.strength = .08 + glowLevel * (.8 + .24 * breath.value + pulse * .12);

    if (returning) {
      const factor = 1 - Math.exp(-dt * 4.5);
      camera.position.lerp(homePosition, factor); controls.target.lerp(homeTarget, factor);
      if (camera.position.distanceTo(homePosition) < .008) {
        camera.position.copy(homePosition); controls.target.copy(homeTarget); returning = false;
      }
    }
    controls.update(dt);
    parallax.lerp(reducedMotion || dragging ? zero : pointer, 1 - Math.exp(-dt * 2.2));
    camera.setViewOffset(width, height, parallax.x * width * .009, -parallax.y * height * .009, width, height);
    camera.updateMatrixWorld(); floating.updateMatrixWorld(true);
    const sources = lightRig.getViewPositions(camera);
    treeLight.getWorldPosition(topSourceView).applyMatrix4(camera.matrixWorldInverse);
    atmosphere.update(t, pulse, glowLevel, [...sources, topSourceView], camera);
    renderer.info.reset();
    composer.render(dt);

    frames++; measureFrames++; measureTime += elapsed;
    if (measureTime > 1.8) {
      const fps = Math.round(measureFrames / measureTime);
      canvas.dataset.fps = String(fps);
      canvas.dataset.drawCalls = String(renderer.info.render.calls);
      canvas.dataset.triangles = String(renderer.info.render.triangles);
      // Adjust only a few times, after shader compilation and the entrance transition.
      if (frames > 150 && fps < 43 && resolutionScale > .7 && t - lastAdjust > 6) {
        resolutionScale = Math.max(.7, resolutionScale * .86); setResolution(); lastAdjust = t;
      }
      measureFrames = 0; measureTime = 0;
    }
  }

  await renderer.compileAsync(scene, camera);
  tree.update(0, 0, glowLevel);
  composer.render(0);
  animate();

  return {
    camera, canvas, controls,
    resize: () => resize(false),
    setPointer(x, y) { pointer.set(x, y); },
    setGlow(value) {
      if (Number.isFinite(value)) glowTarget = Math.max(0, Math.min(1, value));
    },
    reset,
    setAutoRotate(value) { autoRotate = value; },
    setReducedMotion(value) { reducedMotion = value; if (value) autoRotate = false; },
    pulse() { pulseStart = t; },
    setVisible(value) { running = value; previousFrame = performance.now(); },
    get rotationEnabled() { return autoRotate; },
    dispose() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(raf); controls.dispose();
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
        if (object.isInstancedMesh) object.dispose();
        if (object.shadow) object.shadow.dispose();
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      for (const pass of composer.passes) pass.dispose?.();
      composer.dispose(); renderer.dispose();
    },
  };
}
