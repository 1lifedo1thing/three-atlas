// Deterministic noise for the endless valley. Pure functions only: the terrain worker,
// the flight camera and the node tests all read the same world from the same numbers.

/** 32-bit integer hash of up to three integers → [0, 1). Stable across engines. */
export function hash3(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Small seeded PRNG (mulberry32). */
export function random(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GX = new Float64Array([1, -1, 1, -1, 1, -1, 0, 0, 0.7071, -0.7071, 0.7071, -0.7071]);
const GY = new Float64Array([1, 1, -1, -1, 0, 0, 1, -1, 0.7071, 0.7071, -0.7071, -0.7071]);

/** Seeded 2D simplex noise in roughly [-1, 1]. */
export function createNoise2D(seed) {
  const next = random(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512), grad = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; grad[i] = perm[i] % 12; }

  return function noise(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0, t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const g = grad[ii + perm[jj]]; t0 *= t0; n += t0 * t0 * (GX[g] * x0 + GY[g] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const g = grad[ii + i1 + perm[jj + j1]]; t1 *= t1; n += t1 * t1 * (GX[g] * x1 + GY[g] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const g = grad[ii + 1 + perm[jj + 1]]; t2 *= t2; n += t2 * t2 * (GX[g] * x2 + GY[g] * y2); }
    return 70 * n;
  };
}

/** Fractal sum of a noise function; result roughly in [-1, 1]. */
export function fbm(noise, x, y, octaves, lacunarity = 2.03, gain = 0.5) {
  let sum = 0, amp = 0.5, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * f + o * 17.3, y * f - o * 9.1);
    norm += amp; amp *= gain; f *= lacunarity;
  }
  return sum / norm;
}

/** Ridged multifractal in [0, 1]: sharp crests for mountain ranges. */
export function ridged(noise, x, y, octaves, lacunarity = 2.1, gain = 0.52) {
  let sum = 0, amp = 0.5, norm = 0, f = 1, prev = 1;
  for (let o = 0; o < octaves; o++) {
    let n = 1 - Math.abs(noise(x * f + o * 31.7, y * f + o * 12.9));
    n *= n;
    sum += n * amp * prev;
    norm += amp; prev = n; amp *= gain; f *= lacunarity;
  }
  return sum / norm;
}

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
