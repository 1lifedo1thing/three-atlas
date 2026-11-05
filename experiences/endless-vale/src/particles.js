// Motes that travel with the camera: pollen and petals by day, snow in the highlands,
// fireflies after dusk, and sky lanterns drifting up through the night.
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3, Vector4 } from 'three';
import { ATMOSPHERE, atmosphere } from './atmosphere.js';
import { random } from './noise.js';
import { LAYER_NO_REFLECTION } from './water.js';

function seeds(count, seed) {
  const r = random(seed), data = new Float32Array(count * 4);
  for (let i = 0; i < data.length; i++) data[i] = r();
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aSeed', new BufferAttribute(data, 4));
  return g;
}

const COMMON = /* glsl */ `
  attribute vec4 aSeed;
  uniform vec3 uCenter;
  uniform vec3 uBox;
  uniform float uPixel;
  uniform float uTime;
  vec3 wrapBox(vec3 p) {
    vec3 lo = uCenter - uBox * 0.5;
    return lo + mod(p - lo, uBox);
  }
  float edgeFade(vec3 p) {
    vec3 q = abs(p - uCenter) / (uBox * 0.5);
    return 1.0 - smoothstep(0.75, 1.0, max(max(q.x, q.y), q.z));
  }
`;

export function createMotes(count = 1600) {
  const uniforms = { ...atmosphere, uCenter: { value: new Vector3() }, uBox: { value: new Vector3(150, 34, 190) }, uPixel: { value: 1 }, uLand: { value: new Vector4(1, 0, 0, 0) } };
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms,
    vertexShader: COMMON + /* glsl */ `
      uniform vec4 uLand;
      uniform float uNight;
      varying vec3 vColor;
      varying float vAlpha;
      varying vec3 vWorldPos;
      void main() {
        vec3 base = aSeed.xyz * uBox * 7.0;
        float fall = mix(0.25, 1.6, uLand.w) * (1.0 - uNight);
        vec3 drift = vec3(sin(uTime * 0.35 + aSeed.w * 30.0) * 1.6 + uTime * 0.9, sin(uTime * 0.6 + aSeed.x * 20.0) * 0.8 - uTime * fall + uNight * sin(uTime * 0.4 + aSeed.z * 9.0) * 1.2, cos(uTime * 0.27 + aSeed.y * 25.0) * 1.6);
        vec3 p = wrapBox(base + drift);
        p.y = max(p.y, 0.6);
        vWorldPos = p;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        vec3 pollen = vec3(1.0, 0.85, 0.55), petal = vec3(1.0, 0.62, 0.78), snow = vec3(0.9, 0.93, 1.0), firefly = vec3(1.0, 0.72, 0.32);
        vec3 day = mix(mix(pollen, petal, uLand.y), snow, uLand.w);
        float blink = pow(0.5 + 0.5 * sin(uTime * (1.2 + aSeed.w * 1.8) + aSeed.x * 50.0), 3.0);
        vColor = mix(day * 0.55, firefly * (0.4 + 3.6 * blink), uNight);
        float size = mix(mix(0.09, 0.2, uLand.y), 0.14, uLand.w) * (0.5 + aSeed.w);
        size = mix(size, 0.16 + 0.1 * aSeed.w, uNight);
        gl_PointSize = clamp(size * uPixel / max(dist, 0.1), 1.0, 40.0);
        vAlpha = edgeFade(p) * smoothstep(2.0, 8.0, dist) * (0.55 + 0.45 * uNight) * (uNight > 0.5 ? step(0.45, aSeed.z) : 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      varying vec3 vWorldPos;
      ${ATMOSPHERE}
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 c = vColor * a * vAlpha * (1.0 - fogAmount(vWorldPos));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const points = new Points(seeds(count, 99), material);
  points.frustumCulled = false; points.layers.set(LAYER_NO_REFLECTION);
  return { points, uniforms };
}

export function createLanterns(count = 90) {
  const uniforms = { ...atmosphere, uCenter: { value: new Vector3() }, uBox: { value: new Vector3(700, 150, 900) }, uPixel: { value: 1 } };
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms,
    vertexShader: COMMON + /* glsl */ `
      uniform float uNight;
      varying float vAlpha;
      varying float vFlicker;
      varying vec3 vWorldPos;
      void main() {
        vec3 base = aSeed.xyz * uBox * 3.0;
        vec3 p = wrapBox(base + vec3(sin(uTime * 0.1 + aSeed.w * 20.0) * 6.0 + uTime * 0.6, uTime * (0.7 + aSeed.w * 0.6), 0.0));
        p.y += 18.0;
        vWorldPos = p;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(1.5 * uPixel / max(-mv.z, 1.0), 1.5, 48.0);
        vFlicker = 0.85 + 0.15 * sin(uTime * 7.0 + aSeed.x * 40.0);
        vAlpha = edgeFade(p) * smoothstep(0.45, 0.85, uNight) * smoothstep(20.0, 60.0, -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vFlicker;
      varying vec3 vWorldPos;
      ${ATMOSPHERE}
      void main() {
        vec2 q = (gl_PointCoord - 0.5) * vec2(1.6, 1.0);
        float body = smoothstep(0.32, 0.18, length(q));
        float halo = exp(-dot(q, q) * 14.0) * 0.6;
        vec3 c = vec3(1.0, 0.62, 0.28) * (body * 2.2 + halo) * vFlicker * vAlpha * (1.0 - fogAmount(vWorldPos) * 0.7);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const points = new Points(seeds(count, 77), material);
  points.frustumCulled = false; points.layers.set(LAYER_NO_REFLECTION);
  return { points, uniforms };
}
