import { BufferAttribute, BufferGeometry, Color, Vector3 } from 'three';

export const TAU = Math.PI * 2;

export const BREATH_PERIOD = 8.4;

// One continuous envelope drives the tree, its halo and nearby particles.
// The longer exhale makes the light settle gently instead of flashing on/off.
export function sampleBreathing(t) {
  const phase = ((t % BREATH_PERIOD) + BREATH_PERIOD) % BREATH_PERIOD;
  const inhale = 3.2;
  return phase < inhale
    ? .5 - .5 * Math.cos(Math.PI * phase / inhale)
    : .5 + .5 * Math.cos(Math.PI * (phase - inhale) / (BREATH_PERIOD - inhale));
}

export function random(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function boundary(angle) {
  return 3.13 * (1 + 0.067 * Math.sin(angle * 3 + 0.8) + 0.043 * Math.cos(angle * 7) + 0.022 * Math.sin(angle * 11));
}

export function heightAt(x, z) {
  return 0.1 + 0.11 * Math.sin(x * 0.9 + z * 0.4) + 0.08 * Math.cos(z * 1.5 - x * 0.25) + 0.035 * Math.sin(x * 3 + z * 2);
}

export function insideIsland(x, z, margin = 0) {
  const angle = Math.atan2(z / 0.84, x);
  return Math.hypot(x, z / 0.84) < boundary(angle) - margin;
}

export function geometryFromTriangles(positions, colors) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  if (colors) geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Parallel-transport frames keep the organic branches smooth, including their tips.
export function taperedTube(curve, radius, segments = 20, sides = 7, taper = 1.6) {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions = [], colors = [], indices = [];
  const bottom = new Color('#14303e'), top = new Color('#61516f');
  const color = new Color(), point = new Vector3(), normal = new Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    const r = radius * (0.035 + 0.965 * Math.pow(1 - t, taper));
    color.copy(bottom).lerp(top, t * 0.8);
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * TAU;
      const ridge = 1 + 0.07 * Math.sin(j * 5 + t * 13);
      normal.copy(frames.normals[i]).multiplyScalar(Math.cos(angle)).addScaledVector(frames.binormals[i], Math.sin(angle));
      positions.push(point.x + normal.x * r * ridge, point.y + normal.y * r * ridge, point.z + normal.z * r * ridge);
      colors.push(color.r, color.g, color.b);
      if (i < segments && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
