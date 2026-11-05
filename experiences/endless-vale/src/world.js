// The endless valley as pure functions of world position.
// A river winds forever along -Z; the land is carved around it and drifts through four lands.
import { createNoise2D, fbm, ridged, clamp, lerp, smoothstep } from './noise.js';

export const WATER_Y = 0;
export const BIOME_LENGTH = 1500;
export const BIOME_BLEND = 0.3;
export const BIOMES = ['meadow', 'blossom', 'mesa', 'frost'];

const nHill = createNoise2D(101), nRidge = createNoise2D(202), nDetail = createNoise2D(303);
const nWarp = createNoise2D(404), nRiver = createNoise2D(505), nColor = createNoise2D(606);

const srgb = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => Math.pow(c / 255, 2.2));
};
const palette = list => list.map(srgb);

/** Per-land parameters. Colours are authored in sRGB and stored linear. */
export const LANDS = [
  { // Golden meadow: amber grass, maples, cottages and pampas.
    hill: 24, mountain: 150, detail: 1.6, terrace: 0, snow: 150,
    ground: palette(['#c39b45', '#a27b34', '#d6bd76']), rock: palette(['#8b7c70', '#a69380']), sand: srgb('#d7c29b'),
    grass: { density: 1, height: 0.95, base: srgb('#8f6d27'), tip: srgb('#f1d27c'), flowers: palette(['#f08aa0', '#fff6ea', '#ffd36a']), flowerRate: 0.07 },
    trees: { round: 0.5, cone: 0.12, roundColors: palette(['#e8a23c', '#d8602e', '#f2c85a', '#c9463a']), coneColors: palette(['#8c3b2e', '#b0562b']) },
    rocks: 0.22, crystals: 0.025, pillars: 0.03, cottages: 0.5, islands: 0.05,
    crystal: srgb('#ff8fb8'), stone: srgb('#cdbfa9'), rune: srgb('#ffcf7a'),
  },
  { // Pink mist hills: muhly grass, blossom trees, pale stone.
    hill: 30, mountain: 120, detail: 1.4, terrace: 0, snow: 150,
    ground: palette(['#c08c98', '#a2707f', '#dcb7b2']), rock: palette(['#978893', '#b3a2a9']), sand: srgb('#dfc8b8'),
    grass: { density: 0.95, height: 1.15, base: srgb('#985670'), tip: srgb('#f6b6cb'), flowers: palette(['#ffffff', '#f5e2ff', '#ffd0dc']), flowerRate: 0.05 },
    trees: { round: 0.62, cone: 0.05, roundColors: palette(['#f4b4c7', '#f8dbe4', '#e488a7', '#fbe9ef']), coneColors: palette(['#7c4a6a', '#9a5d80']) },
    rocks: 0.16, crystals: 0.035, pillars: 0.05, cottages: 0.32, islands: 0.07,
    crystal: srgb('#d9a0ff'), stone: srgb('#e5d7d0'), rune: srgb('#ffc2e0'),
  },
  { // Ember mesa: terraced terracotta, monoliths, violet crystals.
    hill: 26, mountain: 95, detail: 2.4, terrace: 1, snow: 170,
    ground: palette(['#c06c43', '#a35236', '#d89a66']), rock: palette(['#a8553a', '#d48a5c']), sand: srgb('#dfac7b'),
    grass: { density: 0.35, height: 0.65, base: srgb('#9a5f39'), tip: srgb('#eab87b'), flowers: palette(['#ffe0a8']), flowerRate: 0.02 },
    trees: { round: 0.08, cone: 0.16, roundColors: palette(['#efe4d2', '#e7c07a']), coneColors: palette(['#5c2f3e', '#7a3b33']) },
    rocks: 0.32, crystals: 0.22, pillars: 0.28, cottages: 0.04, islands: 0.08,
    crystal: srgb('#b48cff'), stone: srgb('#a65a3e'), rune: srgb('#ffb066'),
  },
  { // Frost highlands: snowfields, indigo pines, ice crystals and lanterns.
    hill: 34, mountain: 230, detail: 2, terrace: 0, snow: 26,
    ground: palette(['#e4e7f0', '#c6c9da', '#a9acc2']), rock: palette(['#7b8098', '#999eb4']), sand: srgb('#cdd0dd'),
    grass: { density: 0.3, height: 0.5, base: srgb('#9b9db6'), tip: srgb('#eef0f8'), flowers: palette(['#bccaff']), flowerRate: 0.02 },
    trees: { round: 0.12, cone: 0.5, roundColors: palette(['#eef1f8', '#c9d3ee']), coneColors: palette(['#3d4766', '#56608a', '#e9eef8']) },
    rocks: 0.28, crystals: 0.18, pillars: 0.14, cottages: 0.08, islands: 0.04,
    crystal: srgb('#9fd8ff'), stone: srgb('#a1a6bd'), rune: srgb('#a8d8ff'),
  },
];
const SNOW = srgb('#f4f2f7');

const mod4 = k => ((k % 4) + 4) % 4;

export function pathX(s) {
  return 72 * Math.sin(s * 0.0023 + 0.6) + 30 * Math.sin(s * 0.0059 + 2.1) + 11 * Math.sin(s * 0.0131 + 0.3);
}
export function pathSlope(s) {
  return 72 * 0.0023 * Math.cos(s * 0.0023 + 0.6) + 30 * 0.0059 * Math.cos(s * 0.0059 + 2.1) + 11 * 0.0131 * Math.cos(s * 0.0131 + 0.3);
}
export const riverHalfWidth = s => 13 + 5.5 * nRiver(s * 0.0035, 3.7);
export const valleyHalfWidth = s => 90 + 30 * nRiver(s * 0.0021, 11.3);

/** Land weights at a world position; sums to 1. The journey starts in the golden meadow. */
export function biomeAt(x, z, out = new Float32Array(4)) {
  const s = -z;
  const u = (s + 210 * nWarp(x * 0.0015, s * 0.0015)) / BIOME_LENGTH + 0.2;
  const k = Math.floor(u), t = smoothstep(1 - BIOME_BLEND, 1, u - k);
  out[0] = out[1] = out[2] = out[3] = 0;
  out[mod4(k)] += 1 - t; out[mod4(k + 1)] += t;
  return out;
}

const table = key => Float64Array.from(LANDS, land => land[key]);
const HILL = table('hill'), MOUNTAIN = table('mountain'), DETAIL = table('detail');
const mix4 = (w, t) => w[0] * t[0] + w[1] * t[1] + w[2] * t[2] + w[3] * t[3];

/** Terrain height and context at (x, z). `out` is reused to avoid allocation. */
export function sampleTerrain(x, z, out = { h: 0, d: 0, rw: 0, valley: 0, w: new Float32Array(4) }) {
  const s = -z, d = x - pathX(s), ad = Math.abs(d) + 2.6 * nRiver(x * 0.045, z * 0.045) + 1.2 * nRiver(x * 0.13 + 7, z * 0.13);
  const w = biomeAt(x, z, out.w);
  let H = 7 + fbm(nHill, x * 0.0042, z * 0.0042, 4) * mix4(w, HILL);
  const ridge = ridged(nRidge, x * 0.0021, z * 0.0021, 5);
  H += (ridge * ridge * 0.8 + ridge * 0.25) * mix4(w, MOUNTAIN) * smoothstep(70, 380, ad);
  H += fbm(nDetail, x * 0.035, z * 0.035, 3) * mix4(w, DETAIL);
  const terrace = w[2] * smoothstep(28, 70, ad);
  if (terrace > 0.001) {
    const step = 10.5, q = H / step, fl = Math.floor(q);
    H = lerp(H, (fl + smoothstep(0.68, 0.96, q - fl)) * step, terrace * 0.92);
  }
  const rw = riverHalfWidth(s), vw = valleyHalfWidth(s);
  let floor;
  if (ad < rw) { const q = ad / rw; floor = -3.4 * (1 - q * q) + 0.25; }
  else floor = 0.25 + (ad - rw) * 0.05 + 1.25 * smoothstep(rw, rw + 3.5, ad);
  const valley = smoothstep(rw + 4, vw, ad);
  out.h = lerp(floor, H, valley);
  out.d = d; out.rw = rw; out.valley = valley;
  return out;
}

export function heightAt(x, z) { return sampleTerrain(x, z).h; }

/**
 * Linear albedo for a terrain vertex. `ny` is the up component of the surface normal,
 * `cavity` is negative in hollows and positive on crests.
 */
export function groundColor(x, z, h, ny, cavity, w, out = [0, 0, 0]) {
  const n1 = nColor(x * 0.012, z * 0.012) * 0.5 + 0.5, n2 = nColor(x * 0.071 + 40, z * 0.071) * 0.5 + 0.5;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < 4; i++) {
    if (w[i] < 0.001) continue;
    const L = LANDS[i], G = L.ground;
    // Ground: two tones drifting across the land, plus a dry highlight on exposed ground.
    let cr = lerp(G[0][0], G[1][0], n1), cg = lerp(G[0][1], G[1][1], n1), cb = lerp(G[0][2], G[1][2], n1);
    const dry = smoothstep(0.55, 0.9, n2) * 0.5;
    cr = lerp(cr, G[2][0], dry); cg = lerp(cg, G[2][1], dry); cb = lerp(cb, G[2][2], dry);
    // Rock on steep faces, in strata for the mesa.
    const rockT = smoothstep(0.84, 0.66, ny);
    const strata = L.terrace ? 0.5 + 0.5 * Math.sin(h * 0.9 + n1 * 2) : n2;
    const rr = lerp(L.rock[0][0], L.rock[1][0], strata), rg = lerp(L.rock[0][1], L.rock[1][1], strata), rb = lerp(L.rock[0][2], L.rock[1][2], strata);
    cr = lerp(cr, rr, rockT); cg = lerp(cg, rg, rockT); cb = lerp(cb, rb, rockT);
    // Sand banks along the water.
    const sandT = smoothstep(0.35 + 1.5 * Math.max(n2 - 0.35, 0), 0.2, h);
    cr = lerp(cr, L.sand[0], sandT); cg = lerp(cg, L.sand[1], sandT); cb = lerp(cb, L.sand[2], sandT);
    // Snow above the land's snow line on gentler slopes.
    const snowT = smoothstep(L.snow - 6, L.snow + 10, h + n1 * 14) * smoothstep(0.55, 0.75, ny);
    cr = lerp(cr, SNOW[0], snowT); cg = lerp(cg, SNOW[1], snowT); cb = lerp(cb, SNOW[2], snowT);
    r += cr * w[i]; g += cg * w[i]; b += cb * w[i];
  }
  // Wet ground just above and below the waterline.
  const wet = 1 - 0.42 * smoothstep(0.9, -0.2, h);
  const ao = clamp(1 + cavity * 0.09, 0.62, 1.12);
  out[0] = r * wet * ao; out[1] = g * wet * ao; out[2] = b * wet * ao;
  return out;
}

/** Point on the river centreline at travel distance s. */
export function pathPoint(s, out = { x: 0, z: 0 }) {
  out.x = pathX(s); out.z = -s;
  return out;
}

/** Land weights along the river at travel distance s (used for particles, sound and labels). */
export function landAt(s) {
  return biomeAt(pathX(s), -s);
}
