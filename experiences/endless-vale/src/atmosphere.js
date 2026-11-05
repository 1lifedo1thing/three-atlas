// One atmosphere for every surface: the same sky colour is used for the dome, the haze and the water,
// so distant hills melt into the horizon instead of ending at a fog wall.
import { Color, Vector3 } from 'three';

export const FOG_FAR = 1500;

/** Uniform objects shared by reference across every material. */
export const atmosphere = {
  uSunDir: { value: new Vector3(0, 0.2, -1).normalize() },
  uMoonDir: { value: new Vector3(0.4, 0.35, -1).normalize() },
  uSunColor: { value: new Color(1, 0.7, 0.4) },
  uZenith: { value: new Color(0.1, 0.15, 0.4) },
  uHorizon: { value: new Color(1, 0.6, 0.4) },
  uFogColor: { value: new Color(0.9, 0.6, 0.5) },
  uHaze: { value: 1 },
  uNight: { value: 0 },
  uGlow: { value: 0 },
  uTime: { value: 0 },
  uWind: { value: 0 },
  uFogDensity: { value: 0.0027 },
  uFogFalloff: { value: 0.015 },
  uFogFar: { value: FOG_FAR },
};

export const ATMOSPHERE = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform vec3 uSunColor;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uFogColor;
uniform float uHaze;
uniform float uNight;
uniform float uGlow;
uniform float uTime;
uniform float uWind;
uniform float uFogDensity;
uniform float uFogFalloff;
uniform float uFogFar;

vec3 skyColor(vec3 dir) {
  float y = dir.y;
  vec3 c = mix(uHorizon, uZenith, pow(clamp(y, 0.0, 1.0), 0.38));
  c = mix(c, uFogColor, smoothstep(0.02, -0.25, y));
  float mu = max(dot(dir, uSunDir), 0.0);
  float sunLow = 1.0 - smoothstep(0.05, 0.6, uSunDir.y);
  // Forward scattering around the sun, strongest when it is low.
  c += uSunColor * (pow(mu, 7.0) * (0.1 + 0.32 * sunLow) + pow(mu, 64.0) * 0.32) * uHaze * (1.0 - uNight * 0.85);
  // A warm band along the horizon on the sun's side of the sky.
  vec2 a = normalize(dir.xz + vec2(1e-4)), b = normalize(uSunDir.xz + vec2(1e-4));
  c += uSunColor * pow(max(dot(a, b), 0.0), 3.0) * exp(-abs(y) * 8.0) * 0.18 * sunLow * uHaze;
  // Moonlit glow at night.
  float nu = max(dot(dir, uMoonDir), 0.0);
  c += vec3(0.32, 0.38, 0.75) * pow(nu, 18.0) * 0.12 * uNight;
  return c;
}

vec3 fogColorFor(vec3 dir) {
  return skyColor(normalize(vec3(dir.x, clamp(dir.y, 0.0, 0.18), dir.z)));
}

float fogAmount(vec3 worldPos) {
  vec3 v = worldPos - cameraPosition;
  float dist = length(v);
  float dy = v.y / max(dist, 1e-3);
  // Exponential height fog integrated along the view ray.
  float k = uFogDensity * exp(-max(cameraPosition.y, -4.0) * uFogFalloff);
  float t = dy * uFogFalloff * dist;
  float optical = abs(t) > 1e-4 ? k * dist * (1.0 - exp(-t)) / t : k * dist;
  float amount = 1.0 - exp(-optical);
  return max(amount, smoothstep(uFogFar * 0.5, uFogFar, dist));
}

vec3 applyAtmosphere(vec3 color, vec3 worldPos) {
  vec3 dir = normalize(worldPos - cameraPosition);
  return mix(color, fogColorFor(dir), fogAmount(worldPos));
}
`;

/** Push a sampled time-of-day state into the shared uniforms. */
export function applyTime(state) {
  const u = atmosphere;
  u.uSunDir.value.fromArray(state.sunDir);
  u.uSunColor.value.fromArray(state.sun);
  u.uZenith.value.fromArray(state.zenith);
  u.uHorizon.value.fromArray(state.horizon);
  u.uFogColor.value.fromArray(state.fog);
  u.uHaze.value = state.haze;
  u.uNight.value = state.night;
  u.uGlow.value = state.glow;
}
