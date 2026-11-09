// Sand of time: grains on analytic Keplerian spirals. Radius falls linearly with phase u, so surface
// density goes as 1/r and the orbital angle integrates in closed form: no per-frame CPU work at all.
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import { LENS } from './shaders.js';
import { OMK } from './physics.js';

export function createDust(U, count, rand, randn) {
  const seed = new Float32Array(count * 4), misc = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seed[i * 4] = rand(); seed[i * 4 + 1] = rand(); seed[i * 4 + 2] = Math.max(-3, Math.min(3, randn())); seed[i * 4 + 3] = Math.pow(rand(), 2.2);
    misc[i * 3] = rand() * Math.PI * 2; misc[i * 3 + 1] = rand(); misc[i * 3 + 2] = rand();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aSeed', new BufferAttribute(seed, 4));
  g.setAttribute('aMisc', new BufferAttribute(misc, 3));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uCamPos: U.camPos, uLens: U.lens, uPx: U.px, uTime: { value: 0 }, uDecay: { value: 0 }, uBirth: { value: 0 }, uHeat: { value: 1 }, uFade: { value: 1 }, uOmK: { value: OMK }, uGain: { value: 1 } },
    vertexShader: /* glsl */`${LENS}
      attribute vec4 aSeed; attribute vec3 aMisc;
      uniform float uPx, uTime, uDecay, uBirth, uHeat, uFade, uOmK, uGain;
      varying vec4 vC;
      void main(){
        float rate = 0.0105 * (0.6 + 0.8 * aSeed.x);
        float cyc = uTime * rate + aSeed.y;
        float u = fract(cyc), k = floor(cyc);
        const float R = 46.0;
        float om = 1.0 - u;
        float r = R * om;
        float K = uOmK * pow(R, -1.5) / rate;
        float phi = aMisc.x + k * 2.39996 + K * 2.0 * (inversesqrt(max(om, 0.02)) - 1.0);
        float b = 1.0 - uBirth;
        float rr = r * (b * b * (3.0 - 2.0 * b)) + 0.001;
        float y = aSeed.z * (0.012 * rr + 0.03);
        vec3 p = vec3(cos(phi) * rr, y, sin(phi) * rr);
        vec4 w = vec4(lensWorld(p), 1.0);
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.01);
        float alive = smoothstep(uDecay, uDecay + 0.05, aMisc.z);
        float arm = pow(0.5 + 0.5 * cos(2.0 * (phi - 2.4 * log(r) - uTime * 0.004)), 2.0);
        float a = smoothstep(0.0, 0.08, u) * smoothstep(3.1, 6.5, r) * (1.0 - smoothstep(26.0, 46.0, r)) * alive * smoothstep(0.4, 3.0, dist) * uFade * (0.18 + 0.82 * arm);
        vec3 c = mix(vec3(1.0, 0.56, 0.22), vec3(1.0, 0.82, 0.52), aMisc.y);
        c = mix(c, vec3(1.0, 0.95, 0.88), 1.0 - smoothstep(4.0, 11.0, r));
        if (aMisc.y > 0.93) c = vec3(0.55, 0.72, 1.0);
        c = mix(c, vec3(1.0, 0.92, 0.85), uBirth);
        float heat = mix(0.35, 1.0, uHeat);
        float flick = 1.0 + (1.0 - smoothstep(uDecay, uDecay + 0.05, aMisc.z - 0.02)) * 3.0 * step(0.001, uDecay);
        vC = vec4(c * (0.16 + aSeed.w * 0.9) * heat * flick * uGain * (1.0 + uBirth * 3.0), a);
        gl_PointSize = clamp((0.02 + aSeed.w * 0.05) * uPx / dist, 0.0, 7.0);
        if (a < 0.002) gl_PointSize = 0.0;
      }`,
    fragmentShader: `varying vec4 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c) * 4.0; if (d > 1.0) discard; float a = exp(-d * 3.5) * vC.a; gl_FragColor = vec4(vC.rgb, a); }`,
  });
  const points = new Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}
