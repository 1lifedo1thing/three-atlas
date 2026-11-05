// Sky dome: the shared atmosphere plus sun, moon, drifting clouds, stars and a violet aurora at night.
import { BackSide, Mesh, ShaderMaterial, SphereGeometry } from 'three';
import { ATMOSPHERE, atmosphere } from './atmosphere.js';

export const VALUE_NOISE = /* glsl */ `
float vnHash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(vnHash(i), vnHash(i + vec2(1.0, 0.0)), f.x), mix(vnHash(i + vec2(0.0, 1.0)), vnHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float vfbm(vec2 p, int octaves) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { if (i >= octaves) break; s += a * vnoise(p); p = p * 2.03 + vec2(13.1, 7.7); a *= 0.5; }
  return s;
}
`;

export function createSky({ cloudOctaves = 5 } = {}) {
  const uniforms = { ...atmosphere, uClouds: { value: 0.55 }, uAurora: { value: 0.5 } };
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms,
    defines: { CLOUD_OCTAVES: cloudOctaves },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPos = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
        gl_Position.z = gl_Position.w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uClouds;
      uniform float uAurora;
      varying vec3 vWorldPos;
      ${ATMOSPHERE}
      ${VALUE_NOISE}
      float starHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

      void main() {
        vec3 dir = normalize(vWorldPos - cameraPosition);
        vec3 color = skyColor(dir);
        float mu = dot(dir, uSunDir);
        float day = 1.0 - uNight;
        float cover = 0.0;

        // Stars and aurora, above the horizon only.
        if (uNight > 0.01 && dir.y > 0.0) {
          vec3 sp = dir * 170.0, cell = floor(sp), f = fract(sp) - 0.5;
          float h = starHash(cell);
          vec3 jitter = vec3(starHash(cell + 7.1), starHash(cell + 3.3), starHash(cell + 1.7)) - 0.5;
          float d = length(f - jitter * 0.6);
          float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + h * 4.0) + h * 40.0);
          float star = step(0.986, h) * exp(-d * d * 90.0) * twinkle * (0.6 + 2.6 * fract(h * 91.0));
          color += vec3(0.85, 0.88, 1.0) * star * uNight * smoothstep(0.0, 0.2, dir.y) * 1.6;
          // Aurora: slow violet and rose curtains low over the far side of the valley.
          vec2 ap = dir.xz / (dir.y + 0.35);
          float sway = sin(ap.y * 2.2 + uTime * 0.07) * 1.4 + vnoise(ap * 1.3 + uTime * 0.02) * 2.0;
          float band = smoothstep(0.55, 1.0, sin(ap.x * 2.6 + sway));
          float rays = 0.55 + 0.45 * vnoise(vec2(ap.x * 22.0 + uTime * 0.35, 0.5));
          float height = smoothstep(0.06, 0.24, dir.y) * smoothstep(0.85, 0.35, dir.y);
          vec3 tint = mix(vec3(0.42, 0.22, 0.95), vec3(0.95, 0.32, 0.62), smoothstep(0.1, 0.6, dir.y));
          color += tint * band * rays * height * uNight * uAurora * 0.32;
        }

        // Clouds on a high layer, drifting and passing overhead as the flight moves on.
        if (dir.y > 0.0) {
          vec2 uv = dir.xz / (dir.y + 0.09) * 0.75 + cameraPosition.xz * 0.00022 + vec2(uTime * 0.0035, -uTime * 0.0012);
          float d = vfbm(uv * 1.6, CLOUD_OCTAVES);
          float shade = vfbm(uv * 1.6 + uSunDir.xz * 0.09, CLOUD_OCTAVES);
          cover = smoothstep(1.0 - uClouds, 1.08 - uClouds * 0.35, d) * smoothstep(0.0, 0.16, dir.y);
          float lit = clamp(0.55 + (d - shade) * 4.0, 0.0, 1.0);
          vec3 dark = mix(uZenith, uFogColor, 0.55) * (0.8 + 0.2 * day);
          vec3 bright = uSunColor * (0.75 + 0.6 * day) + uHorizon * 0.35;
          vec3 cloud = mix(dark, bright, lit * (0.35 + 0.65 * day));
          cloud += uSunColor * pow(max(mu, 0.0), 10.0) * 1.2 * day;
          cloud = mix(cloud, vec3(0.08, 0.09, 0.16) + uZenith * 0.6, uNight * 0.75);
          color = mix(color, cloud, cover * 0.88);
        }

        // Sun disc, softened by cloud.
        float disc = smoothstep(0.99955, 0.99978, mu);
        color += uSunColor * disc * 24.0 * day * (1.0 - cover * 0.85) * smoothstep(-0.02, 0.01, dir.y);

        // Moon with a faint halo.
        float md = 1.0 - dot(dir, uMoonDir);
        float moon = smoothstep(0.00042, 0.00028, md);
        float craters = 0.86 + 0.14 * vnoise(dir.xy * 900.0);
        color += vec3(1.0, 0.96, 0.9) * moon * craters * 4.0 * uNight * (1.0 - cover * 0.7);
        color += vec3(0.4, 0.45, 0.8) * exp(-md * 500.0) * 0.18 * uNight;

        gl_FragColor = vec4(color, 1.0);
      }`,
  });
  const mesh = new Mesh(new SphereGeometry(1800, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.onBeforeRender = (renderer, scene, camera) => { mesh.position.copy(camera.position); mesh.updateMatrixWorld(); };
  return { mesh, uniforms };
}
