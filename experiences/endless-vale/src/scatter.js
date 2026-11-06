// Deterministic placement of everything that stands on the land.
// Each prop is decided by its own global sub-grid cell, so the result never depends on load order.
import { hash3, random, createNoise2D, clamp, lerp, smoothstep } from './noise.js';
import { LANDS, WATER_Y, sampleTerrain, biomeAt, pathX, pathSlope, riverHalfWidth } from './world.js';

export const CELL = 64;
export const GRASS_CELL = 32;
export const GATE_SPACING = 960;
export const PROP_TYPES = ['treeRound', 'treeCone', 'rock', 'crystal', 'pillar', 'gatePillar', 'gateBeam', 'lantern', 'cottage', 'island'];

const nForest = createNoise2D(707), nVillage = createNoise2D(808), nMeadow = createNoise2D(909);

/** Height field with a one-sample border, for cheap interpolated heights and normals inside a square. */
export function heightGrid(x0, z0, size, res) {
  const n = res + 3, sp = size / res, h = new Float32Array(n * n), w = new Float32Array(4 * n * n);
  const out = { h: 0, d: 0, rw: 0, valley: 0, w: new Float32Array(4) };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    sampleTerrain(x0 + (i - 1) * sp, z0 + (j - 1) * sp, out);
    const k = j * n + i; h[k] = out.h; w.set(out.w, k * 4);
  }
  return { x0, z0, size, res, n, sp, h, w };
}

/** Bilinear height, normal.y and land weights at a point inside the grid. */
export function gridSample(grid, x, z, out = { h: 0, ny: 1, nx: 0, nz: 0, w: new Float32Array(4) }) {
  const { n, sp, h } = grid;
  const fx = clamp((x - grid.x0) / sp, 0, grid.res - 1e-6) + 1, fz = clamp((z - grid.z0) / sp, 0, grid.res - 1e-6) + 1;
  const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, k = j * n + i;
  const h00 = h[k], h10 = h[k + 1], h01 = h[k + n], h11 = h[k + n + 1];
  out.h = lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), tz);
  const gx = (lerp(h10 - h[k - 1], h[k + 2] - h00, tx) + lerp(h11 - h[k + n - 1], h[k + n + 2] - h01, tx)) / (4 * sp);
  const gz = (lerp(h01 - h[k - n], h[k + 2 * n] - h00, tz) + lerp(h11 - h[k - n + 1], h[k + 2 * n + 1] - h10, tz)) / (4 * sp);
  const len = Math.sqrt(1 + gx * gx + gz * gz);
  out.nx = -gx / len; out.ny = 1 / len; out.nz = -gz / len;
  const kw = (Math.round(fz) * n + Math.round(fx)) * 4;
  for (let c = 0; c < 4; c++) out.w[c] = grid.w[kw + c];
  return out;
}

const mixLand = (w, pick) => w[0] * pick(LANDS[0]) + w[1] * pick(LANDS[1]) + w[2] * pick(LANDS[2]) + w[3] * pick(LANDS[3]);
function pickColor(w, pick, r) {
  // Choose a land by weight, then a colour from its list.
  let acc = 0, land = LANDS[0];
  const u = r();
  for (let i = 0; i < 4; i++) { acc += w[i]; if (u <= acc + 1e-6) { land = LANDS[i]; break; } }
  const list = pick(land);
  return list[Math.floor(r() * list.length) % list.length];
}

/** Column-major TRS matrix (same layout as THREE.Matrix4.compose). */
export function compose(te, o, x, y, z, qx, qy, qz, qw, sx, sy, sz) {
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2, yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  te[o] = (1 - (yy + zz)) * sx; te[o + 1] = (xy + wz) * sx; te[o + 2] = (xz - wy) * sx; te[o + 3] = 0;
  te[o + 4] = (xy - wz) * sy; te[o + 5] = (1 - (xx + zz)) * sy; te[o + 6] = (yz + wx) * sy; te[o + 7] = 0;
  te[o + 8] = (xz + wy) * sz; te[o + 9] = (yz - wx) * sz; te[o + 10] = (1 - (xx + yy)) * sz; te[o + 11] = 0;
  te[o + 12] = x; te[o + 13] = y; te[o + 14] = z; te[o + 15] = 1;
}

/** Quaternion that yaws by `yaw`, then tilts toward a surface normal by `lean` (0–1). */
function orient(yaw, nx, nz, lean, q) {
  // Tilt axis is up × normal; the angle is scaled by `lean`.
  const tx = nz * lean, tz = -nx * lean, ta = Math.sqrt(tx * tx + tz * tz);
  const k = ta > 1e-6 ? Math.sin(ta / 2) / ta : 0, ax = tx * k, az = tz * k, c = Math.cos(ta / 2);
  const cy = Math.cos(yaw / 2), sy = Math.sin(yaw / 2);
  q[0] = ax * cy - az * sy; q[1] = c * sy; q[2] = az * cy + ax * sy; q[3] = c * cy;
  return q;
}

class Batch {
  constructor() { this.m = []; this.c = []; }
  push(matrix, color) { this.m.push(...matrix); this.c.push(color[0], color[1], color[2]); }
  get count() { return this.c.length / 3; }
  pack() { return { matrices: new Float32Array(this.m), colors: new Float32Array(this.c), count: this.count }; }
}

const M = new Float32Array(16), Q = [0, 0, 0, 1];
function place(batch, x, y, z, yaw, nx, nz, lean, sx, sy, sz, color) {
  orient(yaw, nx, nz, lean, Q);
  compose(M, 0, x, y, z, Q[0], Q[1], Q[2], Q[3], sx, sy, sz);
  batch.push(M, color);
}

/** Visit every global sub-grid cell of spacing `sp` whose origin lies inside the object cell. */
function eachSub(cx, cz, sp, seed, fn) {
  const x0 = cx * CELL, z0 = cz * CELL;
  for (let j = Math.ceil(z0 / sp); j * sp < z0 + CELL; j++) for (let i = Math.ceil(x0 / sp); i * sp < x0 + CELL; i++) {
    const r = random(hash3(i, j, seed) * 4294967296);
    fn(i * sp + r() * sp, j * sp + r() * sp, r);
  }
}

/** All props for one 64 m object cell. Returns packed instance data per type. */
export function scatterCell(cx, cz) {
  const grid = heightGrid(cx * CELL - 8, cz * CELL - 8, CELL + 16, 40);
  const batches = Object.fromEntries(PROP_TYPES.map(type => [type, new Batch()]));
  const s = { h: 0, ny: 1, nx: 0, nz: 0, w: new Float32Array(4) };
  const ground = (x, z) => gridSample(grid, x, z, s);
  const lateral = (x, z) => { const t = -z; return { ad: Math.abs(x - pathX(t)), rw: riverHalfWidth(t) }; };

  // Round-canopy trees: maples, blossoms, silver birches. Groves follow a forest field.
  eachSub(cx, cz, 8.5, 11, (x, z, r) => {
    const g = ground(x, z), { ad, rw } = lateral(x, z);
    if (g.h < 0.9 || g.ny < 0.8 || ad < rw + 3.5) return;
    const forest = smoothstep(-0.25, 0.55, nForest(x * 0.0065, z * 0.0065));
    const p = mixLand(g.w, L => L.trees.round) * (0.25 + 1.35 * forest) * smoothstep(0.8, 0.92, g.ny);
    if (r() > p) return;
    const scale = 0.72 + r() * 0.62;
    place(batches.treeRound, x, g.h - 0.3, z, r() * 6.283, g.nx, g.nz, 0.25, scale, scale * (0.85 + r() * 0.3), scale, pickColor(g.w, L => L.trees.roundColors, r));
  });

  // Conical trees: cypress and pine silhouettes, preferring higher ground.
  eachSub(cx, cz, 10, 12, (x, z, r) => {
    const g = ground(x, z), { ad, rw } = lateral(x, z);
    if (g.h < 1.2 || g.ny < 0.74 || ad < rw + 4) return;
    const forest = smoothstep(-0.4, 0.4, nForest(x * 0.005 + 50, z * 0.005));
    const p = mixLand(g.w, L => L.trees.cone) * (0.3 + 1.2 * forest) * (0.6 + 0.4 * smoothstep(4, 40, g.h));
    if (r() > p) return;
    const scale = 0.7 + r() * 0.7;
    place(batches.treeCone, x, g.h - 0.4, z, r() * 6.283, 0, 0, 0, scale * 0.9, scale * (0.9 + r() * 0.5), scale * 0.9, pickColor(g.w, L => L.trees.coneColors, r));
  });

  // Rocks and boulders, some wading into the shallows.
  eachSub(cx, cz, 12, 13, (x, z, r) => {
    const g = ground(x, z), { ad, rw } = lateral(x, z);
    if (g.h < -1.6 || ad < rw * 0.62) return;
    const p = mixLand(g.w, L => L.rocks) * (0.6 + 0.8 * smoothstep(0.95, 0.7, g.ny));
    if (r() > p) return;
    const big = r() < 0.12 ? 2.2 : 1, scale = (0.6 + r() * 1.4) * big;
    const k = Math.min(Math.floor(r() * 2), 1), rock = LANDS[g.w.indexOf(Math.max(...g.w))].rock[k];
    const tone = 0.85 + r() * 0.3;
    place(batches.rock, x, g.h - scale * 0.25, z, r() * 6.283, g.nx, g.nz, 0.6, scale * (0.8 + r() * 0.6), scale * (0.55 + r() * 0.5), scale * (0.8 + r() * 0.6), [rock[0] * tone, rock[1] * tone, rock[2] * tone]);
  });

  // Glowing crystal clusters.
  eachSub(cx, cz, 21, 14, (x, z, r) => {
    const g = ground(x, z), { ad, rw } = lateral(x, z);
    if (g.h < 0.6 || ad < rw + 4) return;
    if (r() > mixLand(g.w, L => L.crystals)) return;
    const land = LANDS[g.w.indexOf(Math.max(...g.w))];
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const ox = (r() - 0.5) * 6, oz = (r() - 0.5) * 6, gg = ground(x + ox, z + oz), scale = 0.55 + r() * 1.1;
      place(batches.crystal, x + ox, gg.h - 0.4, z + oz, r() * 6.283, gg.nx, gg.nz, 0.5, scale, scale * (0.8 + r() * 0.7), scale, land.crystal);
    }
  });

  // Standing stones with rune bands that wake at night.
  eachSub(cx, cz, 32, 15, (x, z, r) => {
    const g = ground(x, z), { ad, rw } = lateral(x, z);
    if (g.h < 0.6 || g.ny < 0.86 || ad < rw + 6) return;
    if (r() > mixLand(g.w, L => L.pillars)) return;
    const land = LANDS[g.w.indexOf(Math.max(...g.w))];
    const n = r() < 0.4 ? 3 : 1, yaw = r() * 6.283;
    for (let k = 0; k < n; k++) {
      const a = yaw + k * 2.1, rad = n > 1 ? 6 + r() * 3 : 0, px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad, gg = ground(px, pz);
      const scale = 0.8 + r() * 0.7;
      place(batches.pillar, px, gg.h - 1, pz, a + 1.57, 0, 0, 0, scale, scale * (0.8 + r() * 0.6), scale, land.stone);
    }
  });

  // Cottages gather in villages on gentle ground facing the river.
  eachSub(cx, cz, 20, 16, (x, z, r) => {
    const g = ground(x, z), { ad, rw } = lateral(x, z);
    if (g.h < 1.4 || g.ny < 0.93 || ad < rw + 16 || ad > 190) return;
    const village = smoothstep(0.25, 0.6, nVillage(x * 0.004, z * 0.004));
    if (r() > mixLand(g.w, L => L.cottages) * village * 1.6) return;
    const face = Math.atan2(pathX(-z) - x, 0);
    const scale = 0.85 + r() * 0.45;
    const roofs = [[0.47, 0.09, 0.05], [0.16, 0.07, 0.2], [0.05, 0.1, 0.26], [0.58, 0.26, 0.07], [0.33, 0.05, 0.05]];
    place(batches.cottage, x, g.h - 0.2, z, face + (r() - 0.5) * 0.9, 0, 0, 0, scale, scale * (0.9 + r() * 0.35), scale, roofs[Math.floor(r() * roofs.length)]);
  });

  // Floating islands far above the valley.
  eachSub(cx, cz, 64, 17, (x, z, r) => {
    const g = ground(x, z), { ad } = lateral(x, z);
    if (ad < 95 || ad > 360) return;
    // Islands keep their distance from each other: only every other cell may hold one.
    if (((cx + cz) & 1) !== 0 || r() > mixLand(g.w, L => L.islands) * 1.6) return;
    const scale = 0.7 + r() * 0.9;
    const land = LANDS[g.w.indexOf(Math.max(...g.w))];
    const top = land.trees.roundColors[Math.floor(r() * land.trees.roundColors.length)];
    place(batches.island, x, Math.max(g.h, WATER_Y) + 40 + r() * 55, z, r() * 6.283, 0, 0, 0, scale, scale, scale, top);
  });

  // Lanterns along the banks and gates across the river are laid out by travel distance.
  const sMin = -(cz + 1) * CELL, sMax = -cz * CELL, x0 = cx * CELL, x1 = x0 + CELL;
  for (let k = Math.floor((sMin - 12) / 26); k * 26 < sMax; k++) {
    const r = random(hash3(k, 7, 18) * 4294967296), t = k * 26 + r() * 12;
    if (t < sMin || t >= sMax) continue;
    const w = biomeAt(pathX(t), -t), density = 0.35 + 0.5 * w[1] + 0.55 * w[3] + 0.2 * w[0];
    if (r() > density * smoothstep(-0.6, 0.2, nMeadow(t * 0.002, 3))) continue;
    const side = r() < 0.5 ? -1 : 1, rw = riverHalfWidth(t), x = pathX(t) + side * (rw + 2.2 + r() * 2.5), z = -t;
    if (x < x0 || x >= x1) continue;
    const g = ground(x, z);
    if (g.h < 0.25 || g.h > 4.5) continue;
    place(batches.lantern, x, g.h - 0.15, z, r() * 6.283, 0, 0, 0, 1, 0.9 + r() * 0.3, 1, LANDS[w.indexOf(Math.max(...w))].stone);
  }
  for (let k = Math.floor((sMin - 660) / GATE_SPACING); k * GATE_SPACING < sMax; k++) {
    const r = random(hash3(k, 3, 19) * 4294967296), t = k * GATE_SPACING + 420 + r() * 240;
    if (t < sMin || t >= sMax) continue;
    const x = pathX(t), z = -t;
    if (x < x0 || x >= x1) continue;
    // A gate spans the river: two pillars on the banks and a beam the flight passes under.
    const w = biomeAt(x, z), rw = riverHalfWidth(t), slope = pathSlope(t), n = Math.hypot(1, slope), yaw = -Math.atan(slope);
    const stone = LANDS[w.indexOf(Math.max(...w))].stone, half = rw + 7;
    for (const side of [-1, 1]) {
      const px = x + side * half / n, pz = z + side * half * slope / n, g = ground(px, pz);
      place(batches.gatePillar, px, Math.min(g.h, 0.5) - 1.5, pz, yaw, 0, 0, 0, 1, 1, 1, stone);
    }
    place(batches.gateBeam, x, 0, z, yaw, 0, 0, 0, half / 10, 1, 1, stone);
  }

  return Object.fromEntries(PROP_TYPES.map(type => [type, batches[type].pack()]));
}

/** Where the next gate stands after travel distance s (for tests and the HUD). */
export function gateAfter(s) {
  for (let k = Math.floor(s / GATE_SPACING) - 1; ; k++) {
    const r = random(hash3(k, 3, 19) * 4294967296), t = k * GATE_SPACING + 420 + r() * 240;
    if (t > s) return t;
  }
}

/**
 * Grass tufts and flowers for one 32 m grass cell.
 * Per instance: x, y, z, yaw, height, width, lean, base rgb, tip rgb (13 floats).
 */
export const GRASS_STRIDE = 13;
export function scatterGrass(cx, cz, density = 1) {
  const x0 = cx * GRASS_CELL, z0 = cz * GRASS_CELL;
  const grid = heightGrid(x0, z0, GRASS_CELL, 16);
  const s = { h: 0, ny: 1, nx: 0, nz: 0, w: new Float32Array(4) };
  const sp = 0.7, data = [];
  for (let j = Math.ceil(z0 / sp); j * sp < z0 + GRASS_CELL; j++) for (let i = Math.ceil(x0 / sp); i * sp < x0 + GRASS_CELL; i++) {
    const r = random(hash3(i, j, 21) * 4294967296);
    const x = i * sp + r() * sp, z = j * sp + r() * sp, g = gridSample(grid, x, z, s);
    if (g.h < 0.42 || g.ny < 0.8) continue;
    const meadow = smoothstep(-0.5, 0.35, nMeadow(x * 0.02, z * 0.02));
    let snowy = 0;
    for (let k = 0; k < 4; k++) snowy += g.w[k] * smoothstep(LANDS[k].snow - 8, LANDS[k].snow + 6, g.h);
    const p = mixLand(g.w, L => L.grass.density) * (0.35 + 0.65 * meadow) * (1 - snowy) * density;
    if (r() > p) continue;
    let br = 0, bg = 0, bb = 0, tr = 0, tg = 0, tb = 0, height = 0, flowerRate = 0;
    for (let k = 0; k < 4; k++) {
      const G = LANDS[k].grass, wk = g.w[k];
      br += G.base[0] * wk; bg += G.base[1] * wk; bb += G.base[2] * wk;
      tr += G.tip[0] * wk; tg += G.tip[1] * wk; tb += G.tip[2] * wk;
      height += G.height * wk; flowerRate += G.flowerRate * wk;
    }
    const v = 0.82 + r() * 0.36;
    let tip = [tr * v, tg * v, tb * v], lean = 0.15 + r() * 0.35, h = height * (0.55 + r() * 0.75) * (0.7 + 0.5 * meadow), width = 0.9 + r() * 0.5;
    if (r() < flowerRate) { tip = pickColor(g.w, L => L.grass.flowers, r).map(c => c * 1.25); h *= 0.85; width = 1.6; lean *= 0.4; }
    data.push(x, g.h - 0.05, z, r() * 6.283, h, width, lean, br * v, bg * v, bb * v, tip[0], tip[1], tip[2]);
  }
  return new Float32Array(data);
}
