// Time of day: a cyclic set of hand-tuned keys, interpolated smoothly.
// All colours are authored in sRGB and returned linear.

const hex = value => {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => Math.pow(c / 255, 2.2));
};

// zenith, horizon, fog: sky; sun: key light; sky/ground: hemisphere fill.
const KEYS = [
  { hour: 0, zenith: '#04061a', horizon: '#1a1d40', fog: '#181b38', sun: '#8ea0ff', light: 0.55, sky: '#28305e', ground: '#120f22', fill: 0.85, exposure: 1.2, night: 1, glow: 1, haze: 0.55 },
  { hour: 4.7, zenith: '#070a22', horizon: '#252650', fog: '#201f42', sun: '#9aa6ff', light: 0.5, sky: '#2c3262', ground: '#141124', fill: 0.85, exposure: 1.2, night: 1, glow: 1, haze: 0.55 },
  { hour: 5.7, zenith: '#283068', horizon: '#d8878d', fog: '#7f647f', sun: '#ff9478', light: 0.7, sky: '#5d5c96', ground: '#33263a', fill: 0.85, exposure: 1.12, night: 0.6, glow: 0.75, haze: 0.85 },
  { hour: 6.7, zenith: '#5068b0', horizon: '#ffbe9c', fog: '#e0aca0', sun: '#ffb487', light: 2.6, sky: '#9aa2d6', ground: '#6a4d48', fill: 0.95, exposure: 0.9, night: 0.06, glow: 0.2, haze: 1 },
  { hour: 9, zenith: '#4a82d4', horizon: '#ead9cb', fog: '#d6d0d2', sun: '#fff0da', light: 3.4, sky: '#a6bde6', ground: '#8a7058', fill: 1, exposure: 0.86, night: 0, glow: 0, haze: 0.62 },
  { hour: 13, zenith: '#3a78d0', horizon: '#dde4ee', fog: '#cad4e2', sun: '#fffaf0', light: 3.8, sky: '#adc6ee', ground: '#8b745e', fill: 1, exposure: 0.82, night: 0, glow: 0, haze: 0.5 },
  { hour: 16.3, zenith: '#4c70c0', horizon: '#f5cfa2', fog: '#e6c09c', sun: '#ffd196', light: 3.4, sky: '#a2aedc', ground: '#8a6848', fill: 1, exposure: 0.86, night: 0, glow: 0, haze: 0.7 },
  { hour: 17.5, zenith: '#4d5cab', horizon: '#ffab68', fog: '#eaa37a', sun: '#ffa855', light: 3.2, sky: '#9590c4', ground: '#7a523e', fill: 0.95, exposure: 0.84, night: 0, glow: 0.1, haze: 0.85 },
  { hour: 18.45, zenith: '#3c4190', horizon: '#ff7c58', fog: '#d27268', sun: '#ff7843', light: 1.8, sky: '#7c72ac', ground: '#583838', fill: 0.9, exposure: 0.95, night: 0.12, glow: 0.5, haze: 1 },
  { hour: 19.3, zenith: '#28285f', horizon: '#c05b84', fog: '#784970', sun: '#ff6b6e', light: 0.75, sky: '#4c4884', ground: '#2c2034', fill: 0.85, exposure: 1.12, night: 0.55, glow: 0.88, haze: 0.85 },
  { hour: 20.5, zenith: '#0a0d2a', horizon: '#30315e', fog: '#26284e', sun: '#9cadff', light: 0.55, sky: '#2c3364', ground: '#141226', fill: 0.85, exposure: 1.2, night: 1, glow: 1, haze: 0.55 },
].map(key => ({ ...key, zenith: hex(key.zenith), horizon: hex(key.horizon), fog: hex(key.fog), sun: hex(key.sun), sky: hex(key.sky), ground: hex(key.ground) }));

const COLOR_KEYS = ['zenith', 'horizon', 'fog', 'sun', 'sky', 'ground'];
const SCALAR_KEYS = ['light', 'fill', 'exposure', 'night', 'glow', 'haze'];

export const PRESETS = { dawn: 6.5, day: 11.5, dusk: 18.2, night: 22.5 };
export const START_HOUR = 17.3;
export const HOURS_PER_SECOND = 1 / 20;

export const wrapHour = hour => ((hour % 24) + 24) % 24;

/** Direction toward the sun: rises front-right, arcs ahead, sets front-left. */
export function sunDirection(hour, out = [0, 0, 0]) {
  const a = ((hour - 6) / 12) * Math.PI;
  const x = Math.cos(a) * 0.34, y = Math.sin(a) * 0.92 + 0.012, z = -1, l = Math.hypot(x, y, z);
  out[0] = x / l; out[1] = y / l; out[2] = z / l;
  return out;
}
export const MOON_DIRECTION = (() => { const v = [0.3, 0.3, -1], l = Math.hypot(...v); return v.map(c => c / l); })();

const smooth = t => t * t * (3 - 2 * t);

/** Sky and light state at an hour (0–24, wraps). */
export function sampleTime(hour, out = {}) {
  const h = wrapHour(hour);
  let i = KEYS.length - 1;
  for (let k = 0; k < KEYS.length; k++) if (KEYS[k].hour <= h) i = k;
  const a = KEYS[i], b = KEYS[(i + 1) % KEYS.length];
  const span = (b.hour - a.hour + 24) % 24 || 24, t = smooth(((h - a.hour + 24) % 24) / span);
  for (const key of COLOR_KEYS) {
    const target = out[key] ?? (out[key] = [0, 0, 0]);
    for (let c = 0; c < 3; c++) target[c] = a[key][c] + (b[key][c] - a[key][c]) * t;
  }
  for (const key of SCALAR_KEYS) out[key] = a[key] + (b[key] - a[key]) * t;
  out.hour = h;
  out.sunDir = sunDirection(h, out.sunDir);
  // The key light follows the sun by day and the moon by night.
  const day = Math.min(Math.max((out.sunDir[1] + 0.06) / 0.12, 0), 1), w = smooth(day);
  const ld = out.lightDir ?? (out.lightDir = [0, 0, 0]);
  for (let c = 0; c < 3; c++) ld[c] = MOON_DIRECTION[c] + (out.sunDir[c] - MOON_DIRECTION[c]) * w;
  const l = Math.hypot(ld[0], ld[1], ld[2]); ld[0] /= l; ld[1] /= l; ld[2] /= l;
  out.day = w;
  return out;
}

/** Shortest forward step (in hours) from one hour to another; time only moves forward. */
export const forwardHours = (from, to) => (wrapHour(to) - wrapHour(from) + 24) % 24;

/** Clock text such as 17:18. */
export function clock(hour) {
  const minutes = Math.floor(wrapHour(hour) * 60 + 1e-6) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
