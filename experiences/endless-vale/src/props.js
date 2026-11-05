// Procedural low-poly models for everything that stands in the valley.
// Each vertex carries colour plus aProp = (tint, sway, glow):
//   tint  – how much the instance colour replaces the vertex colour,
//   sway  – how far wind moves the vertex,
//   glow  – emissive mask that wakes at dusk.
import { BufferAttribute, BoxGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, Matrix4, Vector3, Euler, Quaternion } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createNoise2D, random } from './noise.js';

const lin = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => Math.pow(c / 255, 2.2)); };
const nShape = createNoise2D(4242);
const noise3 = (x, y, z) => (nShape(x + z * 0.7, y - z * 0.3) + nShape(y * 1.3 - 4, z + x * 0.2)) * 0.5;

/**
 * Prepare one part: bake a transform, give it flat or custom normals, and fill colour/aProp.
 * `shade(position) → [r,g,b,tint,sway,glow]` lets parts vary along their height.
 */
function part(geometry, { matrix, flat = false, normals, shade }) {
  let g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute('uv');
  if (matrix) g.applyMatrix4(matrix);
  if (flat) g.computeVertexNormals();
  if (normals) normals(g);
  const p = g.attributes.position, count = p.count;
  const color = new Float32Array(count * 3), prop = new Float32Array(count * 3), v = new Vector3();
  for (let i = 0; i < count; i++) {
    v.fromBufferAttribute(p, i);
    const [r, gg, b, tint, sway, glow] = shade(v, i);
    color.set([r, gg, b], i * 3); prop.set([tint, sway, glow], i * 3);
  }
  g.setAttribute('color', new BufferAttribute(color, 3));
  g.setAttribute('aProp', new BufferAttribute(prop, 3));
  return g;
}

const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(sx, sy, sz));

/** Displace a sphere-like geometry outward with smooth noise. */
function lumpy(g, amount, freq, seed = 0) {
  const p = g.attributes.position, v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise3(v.x * freq + seed, v.y * freq, v.z * freq - seed);
    v.multiplyScalar(1 + n * amount);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/** Normals radiating from a centre: soft, painterly light on foliage. */
const radial = (center, blend = 0.75) => g => {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, v = new Vector3(), m = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).sub(center).normalize();
    m.fromBufferAttribute(n, i).lerp(v, blend).normalize();
    n.setXYZ(i, m.x, m.y, m.z);
  }
};

const BARK = lin('#4a3326'), BARK_PALE = lin('#e9e2d6'), WALL = lin('#efe2cc'), DOOR = lin('#3b2a24'), WINDOW = lin('#ffc77a'), DARK = lin('#2a2224');

function merge(parts) {
  const g = mergeGeometries(parts, false);
  g.computeBoundingSphere();
  return g;
}

/** Round canopy tree, about 9 m tall. */
export function treeRound() {
  const r = random(7), parts = [];
  parts.push(part(new CylinderGeometry(0.2, 0.42, 5, 6, 4, true), {
    matrix: T(0, 2.3, 0),
    normals: g => g.computeVertexNormals(),
    shade: v => { const k = 0.65 + v.y * 0.08; return [BARK[0] * k, BARK[1] * k, BARK[2] * k, 0, Math.max(v.y - 1.5, 0) * 0.04, 0]; },
  }));
  // Two branches reaching into the canopy.
  for (const a of [0.7, 3.6]) parts.push(part(new CylinderGeometry(0.08, 0.16, 2.4, 5, 1, true), {
    matrix: T(Math.cos(a) * 0.55, 4.6, Math.sin(a) * 0.55, Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7),
    normals: g => g.computeVertexNormals(),
    shade: () => [BARK[0], BARK[1], BARK[2], 0, 0.12, 0],
  }));
  const center = new Vector3(0, 6.8, 0);
  const blobs = [[0, 6.6, 0, 2.6], [1.5, 6.1, 0.6, 1.8], [-1.3, 6.4, -0.8, 1.9], [0.3, 7.9, -0.4, 1.7], [-0.4, 5.6, 1.4, 1.5]];
  for (const [x, y, z, s] of blobs) {
    const blob = lumpy(new IcosahedronGeometry(1, 1), 0.2, 1.7, r() * 10);
    parts.push(part(blob, {
      matrix: T(x, y, z, r(), r(), r(), s, s * 0.86, s),
      normals: radial(center, 0.7),
      shade: v => { const k = 0.5 + 0.5 * Math.min(Math.max((v.y - 4.2) / 4.5, 0), 1); return [k, k, k, 1, 0.12 + (v.y - 4) * 0.07, 0]; },
    }));
  }
  return merge(parts);
}

/** Conical tree: three stacked tiers, about 11 m tall. */
export function treeCone() {
  const parts = [part(new CylinderGeometry(0.16, 0.3, 2.6, 5, 1, true), {
    matrix: T(0, 1.1, 0), normals: g => g.computeVertexNormals(),
    shade: () => [BARK[0] * 0.7, BARK[1] * 0.7, BARK[2] * 0.7, 0, 0, 0],
  })];
  const center = new Vector3(0, 6, 0);
  [[2.6, 4.2, 3.4], [2.05, 3.8, 5.6], [1.4, 3.4, 7.7], [0.8, 2.4, 9.6]].forEach(([radius, height, y], i) => {
    const cone = lumpy(new ConeGeometry(radius, height, 8, 2), 0.08, 1.1, i * 3);
    parts.push(part(cone, {
      matrix: T(0, y, 0, 0, i * 0.7),
      normals: radial(center, 0.35),
      shade: v => { const k = 0.55 + 0.45 * Math.min(Math.max((v.y - 1.5) / 9, 0), 1); return [k, k, k, 1, 0.05 + v.y * 0.025, 0]; },
    }));
  });
  return merge(parts);
}

/** Boulder: lumpy, flat-shaded, darker underneath. */
export function rock() {
  const g = lumpy(new IcosahedronGeometry(1, 1), 0.34, 1.3, 3);
  return merge([part(g, {
    matrix: T(0, 0.35, 0, 0, 0, 0, 1.2, 0.85, 1),
    flat: true,
    shade: v => { const k = 0.6 + 0.4 * Math.min(Math.max(v.y + 0.3, 0), 1); return [k, k, k, 1, 0, 0]; },
  })]);
}

/** Crystal cluster: hexagonal shards leaning out from a common root. */
export function crystal() {
  const r = random(11), parts = [];
  const shards = [[0, 0, 0, 3.6, 0.42], [0.7, 0.3, 0.5, 2.4, 0.32], [-0.6, -0.4, 0.2, 2.1, 0.3], [0.2, 0.5, -0.7, 1.7, 0.26], [-0.3, 0.1, 0.8, 1.3, 0.22]];
  for (const [lx, lz, lean, height, radius] of shards) {
    const body = new CylinderGeometry(radius * 0.9, radius, height, 6, 1);
    const tip = new ConeGeometry(radius * 0.9, radius * 2.2, 6, 1);
    tip.translate(0, height / 2 + radius * 1.1, 0);
    const shard = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]);
    shard.translate(0, height / 2, 0);
    parts.push(part(shard, {
      matrix: T(lx, -0.2, lz, lz * 0.5, r() * 6, -lx * 0.5 - lean * 0.2),
      flat: true,
      shade: v => { const t = Math.min(Math.max(v.y / 4, 0), 1); return [0.75 + t * 0.25, 0.75 + t * 0.25, 0.75 + t * 0.25, 1, 0, 0.35 + t * 0.65]; },
    }));
  }
  return merge(parts);
}

/** Standing stone with a glowing rune band. */
export function pillar() {
  const slab = new BoxGeometry(1.7, 9, 1.15, 1, 3, 1);
  const p = slab.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 - (y + 4.5) / 9 * 0.28; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  const stone = v => { const k = 0.72 + 0.28 * Math.min(Math.max(v.y / 9, 0), 1); return [k, k, k, 1, 0, 0]; };
  const rune = () => [0.42, 0.42, 0.42, 1, 0, 1];
  return merge([
    part(slab, { matrix: T(0, 4.5, 0, 0.02, 0, 0.03), flat: true, shade: stone }),
    part(new BoxGeometry(1.86, 0.2, 1.3), { matrix: T(0, 5.6, 0, 0.02, 0, 0.03, 0.88, 1, 0.88), flat: true, shade: rune }),
    part(new BoxGeometry(1.86, 0.12, 1.3), { matrix: T(0, 6.1, 0, 0.02, 0, 0.03, 0.86, 1, 0.86), flat: true, shade: rune }),
    part(new BoxGeometry(0.16, 2.2, 1.24), { matrix: T(0, 3.6, 0, 0.02, 0, 0.03, 1, 1, 0.92), flat: true, shade: rune }),
    part(new BoxGeometry(2.6, 0.7, 2), { matrix: T(0, 0.2, 0, 0, 0.4, 0), flat: true, shade: () => [0.6, 0.6, 0.6, 1, 0, 0] }),
  ]);
}

/** One pillar of a river gate: base, tapered column, capital and vertical rune lines. */
export function gatePillar() {
  const column = new BoxGeometry(3, 22, 3, 1, 4, 1);
  const p = column.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 - (p.getY(i) + 11) / 22 * 0.18; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  const stone = v => { const k = 0.66 + 0.34 * Math.min(Math.max(v.y / 24, 0), 1); return [k, k, k, 1, 0, 0]; };
  const rune = () => [0.42, 0.42, 0.42, 1, 0, 1];
  const parts = [
    part(new BoxGeometry(4.6, 2.4, 4.6), { matrix: T(0, 1.2, 0), flat: true, shade: stone }),
    part(column, { matrix: T(0, 13.2, 0), flat: true, shade: stone }),
    part(new BoxGeometry(4.3, 1.5, 4.3), { matrix: T(0, 24.4, 0), flat: true, shade: stone }),
  ];
  for (const side of [-1, 1]) {
    parts.push(part(new BoxGeometry(0.22, 14, 0.2), { matrix: T(0, 13, side * 1.42), flat: true, shade: rune }));
    parts.push(part(new BoxGeometry(0.2, 14, 0.22), { matrix: T(side * 1.42, 13, 0), flat: true, shade: rune }));
  }
  return merge(parts);
}

/** The beam of a river gate, modelled for a 20 m span and stretched per river width. */
export function gateBeam() {
  const stone = v => { const k = 0.7 + 0.3 * Math.min(Math.max((v.y - 22) / 4, 0), 1); return [k, k, k, 1, 0, 0]; };
  return merge([
    part(new BoxGeometry(24, 1.7, 2.8), { matrix: T(0, 23, 0), flat: true, shade: stone }),
    part(new BoxGeometry(27, 0.9, 3.6), { matrix: T(0, 25.6, 0), flat: true, shade: stone }),
    part(new BoxGeometry(18, 0.18, 0.2), { matrix: T(0, 22.05, 1.42), flat: true, shade: () => [0.42, 0.42, 0.42, 1, 0, 1] }),
    part(new BoxGeometry(18, 0.18, 0.2), { matrix: T(0, 22.05, -1.42), flat: true, shade: () => [0.42, 0.42, 0.42, 1, 0, 1] }),
  ]);
}

/** Stone lantern with a warm core. */
export function lantern() {
  const stone = v => { const k = 0.7 + 0.12 * v.y; return [k, k, k, 1, 0, 0]; };
  const light = [WINDOW[0], WINDOW[1], WINDOW[2], 0, 0, 1];
  return merge([
    part(new BoxGeometry(0.95, 0.4, 0.95), { matrix: T(0, 0.2, 0), flat: true, shade: stone }),
    part(new CylinderGeometry(0.17, 0.22, 1.6, 6), { matrix: T(0, 1.2, 0), flat: true, shade: stone }),
    part(new BoxGeometry(0.85, 0.12, 0.85), { matrix: T(0, 2.03, 0), flat: true, shade: stone }),
    part(new BoxGeometry(0.5, 0.55, 0.5), { matrix: T(0, 2.38, 0), flat: true, shade: () => light }),
    ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z]) => part(new BoxGeometry(0.1, 0.62, 0.1), { matrix: T(x * 0.33, 2.38, z * 0.33), flat: true, shade: stone })),
    part(new ConeGeometry(0.78, 0.55, 4), { matrix: T(0, 2.94, 0, 0, Math.PI / 4), flat: true, shade: stone }),
    part(new BoxGeometry(0.12, 0.22, 0.12), { matrix: T(0, 3.3, 0), flat: true, shade: stone }),
  ]);
}

/** Cottage with a tinted gable roof and windows that light up in the evening. */
export function cottage() {
  const wall = v => { const k = 0.78 + 0.22 * Math.min(v.y / 3, 1); return [WALL[0] * k, WALL[1] * k, WALL[2] * k, 0, 0, 0]; };
  const roof = new CylinderGeometry(2.3, 2.3, 6.2, 3, 1);
  const win = () => [WINDOW[0], WINDOW[1], WINDOW[2], 0, 0, 1];
  return merge([
    part(new BoxGeometry(4.2, 3.2, 5.4), { matrix: T(0, 1.6, 0), flat: true, shade: wall }),
    part(roof, { matrix: T(0, 3.82, 0, -Math.PI / 2, 0, 0, 1.2, 1, 0.62), flat: true, shade: v => { const k = 0.75 + 0.25 * Math.min((v.y - 3) / 2.3, 1); return [k, k, k, 1, 0, 0]; } }),
    part(new BoxGeometry(0.7, 1.8, 0.7), { matrix: T(1.1, 5, -1.4), flat: true, shade: () => [WALL[0] * 0.6, WALL[1] * 0.55, WALL[2] * 0.5, 0, 0, 0] }),
    part(new BoxGeometry(1, 1.8, 0.08), { matrix: T(0, 0.9, 2.72), flat: true, shade: () => [DOOR[0], DOOR[1], DOOR[2], 0, 0, 0] }),
    part(new BoxGeometry(0.9, 0.8, 0.08), { matrix: T(-1.35, 1.9, 2.72), flat: true, shade: win }),
    part(new BoxGeometry(0.9, 0.8, 0.08), { matrix: T(1.35, 1.9, 2.72), flat: true, shade: win }),
    part(new BoxGeometry(0.08, 0.8, 0.9), { matrix: T(2.12, 1.9, -0.8), flat: true, shade: win }),
    part(new BoxGeometry(0.08, 0.8, 0.9), { matrix: T(-2.12, 1.9, 0.9), flat: true, shade: win }),
    part(new BoxGeometry(4.6, 0.3, 5.8), { matrix: T(0, 0.08, 0), flat: true, shade: () => [DARK[0], DARK[1], DARK[2], 0, 0, 0] }),
  ]);
}

/** Floating island: an inverted rock spire with a grassy cap and two trees. */
export function island() {
  const r = random(5), parts = [];
  const spire = lumpy(new ConeGeometry(10, 18, 10, 4), 0.18, 0.22, 2);
  const rockShade = v => { const k = 0.45 + 0.4 * Math.min(Math.max((v.y + 18) / 18, 0), 1); return [0.42 * k, 0.36 * k, 0.33 * k, 0, 0, 0]; };
  parts.push(part(spire, { matrix: T(0, -9.2, 0, Math.PI, 0, 0), flat: true, shade: rockShade }));
  const cap = lumpy(new CylinderGeometry(10.6, 10, 1.6, 12, 1), 0.06, 0.4, 9);
  const top = lin('#b89a5a');
  parts.push(part(cap, { matrix: T(0, -0.5, 0), flat: true, shade: v => { const k = v.y > -0.4 ? 1 : 0.7; return [top[0] * k, top[1] * k, top[2] * k, 0, 0, 0]; } }));
  const center = new Vector3(0, 6, 0);
  for (const [x, z, s] of [[-2.5, 1.5, 1.3], [3.8, -2.2, 0.9], [1.2, 4.6, 0.7]]) {
    parts.push(part(new CylinderGeometry(0.25, 0.45, 4.5, 5, 1, true), { matrix: T(x, 2.2 * s, z, 0, 0, 0, s), normals: g => g.computeVertexNormals(), shade: () => [BARK[0], BARK[1], BARK[2], 0, 0, 0] }));
    const blob = lumpy(new IcosahedronGeometry(2.6, 1), 0.25, 1, r() * 9);
    parts.push(part(blob, { matrix: T(x, 5.6 * s, z, 0, r() * 6, 0, s), normals: radial(new Vector3(x, 5.6 * s, z), 0.7), shade: v => { const k = 0.55 + 0.45 * Math.min(Math.max((v.y - 3 * s) / (5 * s), 0), 1); return [k, k, k, 1, 0, 0]; } }));
  }
  // A few stones hanging beneath, like the island is still shedding its roots.
  for (let i = 0; i < 4; i++) {
    const a = r() * 6.28, d = 4 + r() * 4;
    parts.push(part(lumpy(new IcosahedronGeometry(0.9 + r(), 0), 0.2, 1, i), { matrix: T(Math.cos(a) * d, -14 - r() * 6, Math.sin(a) * d), flat: true, shade: rockShade }));
  }
  return merge(parts);
}

/** Distant round tree: two coarse blobs on a trunk, same silhouette and colours. */
export function treeRoundFar() {
  const center = new Vector3(0, 6.8, 0);
  const shade = v => { const k = 0.5 + 0.5 * Math.min(Math.max((v.y - 4.2) / 4.5, 0), 1); return [k, k, k, 1, 0.12 + (v.y - 4) * 0.07, 0]; };
  return merge([
    part(new CylinderGeometry(0.22, 0.42, 5, 5, 1, true), { matrix: T(0, 2.3, 0), normals: g => g.computeVertexNormals(), shade: () => [BARK[0] * 0.7, BARK[1] * 0.7, BARK[2] * 0.7, 0, 0, 0] }),
    part(lumpy(new IcosahedronGeometry(1, 1), 0.15, 1.5, 2), { matrix: T(0, 6.6, 0, 0, 0, 0, 2.9, 2.5, 2.9), normals: radial(center, 0.8), shade }),
    part(lumpy(new IcosahedronGeometry(1, 0), 0.12, 1.5, 5), { matrix: T(0.4, 8, -0.3, 0.4, 0.2, 0, 1.8, 1.5, 1.8), normals: radial(center, 0.8), shade }),
  ]);
}

/** Distant conical tree. */
export function treeConeFar() {
  const center = new Vector3(0, 6, 0);
  return merge([
    part(new CylinderGeometry(0.16, 0.3, 2.6, 4, 1, true), { matrix: T(0, 1.1, 0), normals: g => g.computeVertexNormals(), shade: () => [BARK[0] * 0.7, BARK[1] * 0.7, BARK[2] * 0.7, 0, 0, 0] }),
    ...[[2.5, 6, 4.2], [1.5, 4.6, 7.6]].map(([radius, height, y]) => part(new ConeGeometry(radius, height, 6, 1), {
      matrix: T(0, y, 0), normals: radial(center, 0.35),
      shade: v => { const k = 0.55 + 0.45 * Math.min(Math.max((v.y - 1.5) / 9, 0), 1); return [k, k, k, 1, 0.05 + v.y * 0.025, 0]; },
    })),
  ]);
}

export const MODELS = { treeRound, treeCone, rock, crystal, pillar, gatePillar, gateBeam, lantern, cottage, island };
export const FAR_MODELS = { treeRound: treeRoundFar, treeCone: treeConeFar };

/** Material settings per prop type (see materials.js). */
export const LOOKS = {
  treeRound: { roughness: 0.85, translucency: 0.75, sway: 1, castShadow: true },
  treeCone: { roughness: 0.9, translucency: 0.35, sway: 0.6, castShadow: true },
  rock: { roughness: 0.92, castShadow: true },
  crystal: { roughness: 0.22, metalness: 0.1, glowFromInstance: 1, glowDay: 0.35, glowNight: 3.2, castShadow: true },
  pillar: { roughness: 0.88, glowColor: '#ffcf86', glowDay: 0, glowNight: 3, castShadow: true },
  gatePillar: { roughness: 0.86, glowColor: '#ffd08f', glowDay: 0.15, glowNight: 3.4, castShadow: true },
  gateBeam: { roughness: 0.86, glowColor: '#ffd08f', glowDay: 0.15, glowNight: 3.4, castShadow: true },
  lantern: { roughness: 0.85, glowColor: '#ffb257', glowDay: 0.08, glowNight: 6, castShadow: true },
  cottage: { roughness: 0.8, glowColor: '#ffbe6e', glowDay: 0, glowNight: 3.6, castShadow: true },
  island: { roughness: 0.9, translucency: 0.5, bob: 1, castShadow: false },
};
