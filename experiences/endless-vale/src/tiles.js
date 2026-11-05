// Terrain tiles: fixed-resolution square grids with skirts, generated from the world functions.
import { sampleTerrain, groundColor, WATER_Y } from './world.js';

export const TILE_RES = 32;
const N = TILE_RES + 1;

/** Shared triangle index for every tile: the grid plus a skirt around its four edges. */
export function tileIndex(res = TILE_RES) {
  const n = res + 1, idx = [];
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    // Alternate the diagonal for a less directional look.
    if ((i + j) & 1) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
  }
  const ring = skirtRing(res), base = n * n;
  for (let k = 0; k < ring.length; k++) {
    const a = ring[k], b = ring[(k + 1) % ring.length], sa = base + k, sb = base + (k + 1) % ring.length;
    idx.push(a, b, sa, b, sb, sa);
  }
  return new Uint32Array(idx);
}

/** Border vertices in clockwise order (viewed from above, +Y), used for skirts. */
function skirtRing(res) {
  const n = res + 1, ring = [];
  for (let i = 0; i < res; i++) ring.push(i);
  for (let j = 0; j < res; j++) ring.push(j * n + res);
  for (let i = res; i > 0; i--) ring.push(res * n + i);
  for (let j = res; j > 0; j--) ring.push(j * n);
  return ring;
}

/**
 * Build one tile in local coordinates (origin at the tile's min corner).
 * Returns positions, normals and linear colours, plus a water surface when the tile dips below the river.
 */
export function buildTile(x0, z0, size, res = TILE_RES) {
  const n = res + 1, m = res + 3, sp = size / res;
  const H = new Float32Array(m * m), W = new Float32Array(m * m * 4);
  const sample = { h: 0, d: 0, rw: 0, valley: 0, w: new Float32Array(4) };
  let minH = Infinity, maxH = -Infinity;
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    sampleTerrain(x0 + (i - 1) * sp, z0 + (j - 1) * sp, sample);
    const k = j * m + i; H[k] = sample.h; W.set(sample.w, k * 4);
  }
  const ring = skirtRing(res), total = n * n + ring.length;
  const position = new Float32Array(total * 3), normal = new Float32Array(total * 3), color = new Float32Array(total * 3);
  const c = [0, 0, 0], w = new Float32Array(4), cavityScale = 1.6 / Math.sqrt(sp);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = (j + 1) * m + (i + 1), h = H[k];
    const gx = (H[k + 1] - H[k - 1]) / (2 * sp), gz = (H[k + m] - H[k - m]) / (2 * sp);
    const len = Math.sqrt(1 + gx * gx + gz * gz), ny = 1 / len;
    const cavity = (h - (H[k + 1] + H[k - 1] + H[k + m] + H[k - m]) / 4) * cavityScale;
    for (let q = 0; q < 4; q++) w[q] = W[k * 4 + q];
    groundColor(x0 + i * sp, z0 + j * sp, h, ny, cavity, w, c);
    const v = (j * n + i) * 3;
    position[v] = i * sp; position[v + 1] = h; position[v + 2] = j * sp;
    normal[v] = -gx / len; normal[v + 1] = ny; normal[v + 2] = -gz / len;
    color[v] = c[0]; color[v + 1] = c[1]; color[v + 2] = c[2];
    if (h < minH) minH = h; if (h > maxH) maxH = h;
  }
  // Skirts drop below each edge so neighbouring tiles of other sizes never show cracks.
  const drop = 2 + sp * 1.5;
  ring.forEach((src, k) => {
    const v = (n * n + k) * 3, s = src * 3;
    position[v] = position[s]; position[v + 1] = position[s + 1] - drop; position[v + 2] = position[s + 2];
    normal[v] = normal[s]; normal[v + 1] = normal[s + 1]; normal[v + 2] = normal[s + 2];
    color[v] = color[s]; color[v + 1] = color[s + 1]; color[v + 2] = color[s + 2];
  });

  let water = null;
  if (minH < WATER_Y + 0.6) {
    // Water shares the grid; each vertex carries how deep the river is beneath it.
    const wp = new Float32Array(n * n * 3), depth = new Float32Array(n * n), idx = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const v = j * n + i;
      wp[v * 3] = i * sp; wp[v * 3 + 1] = WATER_Y; wp[v * 3 + 2] = j * sp;
      depth[v] = WATER_Y - position[v * 3 + 1];
    }
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const a = j * n + i, b = a + 1, cc = a + n, d = cc + 1;
      if (Math.max(depth[a], depth[b], depth[cc], depth[d]) > -0.35) idx.push(a, cc, d, a, d, b);
    }
    if (idx.length) water = { position: wp, depth, index: new Uint32Array(idx) };
  }
  return { position, normal, color, minH, maxH, water };
}
