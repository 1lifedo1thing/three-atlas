// Pure numbers behind the piece. Units: Schwarzschild radius r_s = 1, c = 1.
// Photon sphere 1.5, innermost stable circular orbit 3, critical impact parameter 3√3/2.
// No DOM or WebGL here, so `node --test` can check every formula.

export const TAU = Math.PI * 2;
export const B_CRIT = (3 * Math.sqrt(3)) / 2;
export const OMK = 3.0; // Keplerian scale shared by disk, dust and gears
export const R_MIN = 1.045, R_MAX = 64, R_HOME = 31;
export const E_NOW = Math.log10(1.38e10);
export const E_PLANCK = Math.log10(5.39e-44 / 3.156e7);
export const SECONDS_PER_YEAR_LOG = Math.log10(3.156e7);

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Static observer at radius r: proper time per unit coordinate time, dτ/dt = √(1 − r_s/r). */
export const dilation = r => Math.sqrt(Math.max(1 - 1 / r, 0));
/** Lorentz-like factor γ = 1 / (dτ/dt). */
export const gammaAt = r => 1 / Math.sqrt(Math.max(1 - 1 / r, 1e-7));

/** Angular radius of the shadow seen by a static observer at r (Synge 1966). Exceeds 90° inside the photon sphere. */
export function shadowAngle(r) {
  const s = clamp((B_CRIT * Math.sqrt(Math.max(1 - 1 / r, 0))) / r, 0, 1);
  return r > 1.5 ? Math.asin(s) : Math.PI - Math.asin(s);
}

/** Exaggerated for play: how fast the outside clock runs, and how fast the cosmic age (log10 years) climbs. */
export const clockMultiplier = r => Math.min(Math.exp((gammaAt(r) - 1) * 10), 1e7);
export function epochRate(r) {
  const x = (gammaAt(r) - 1) * 10;
  return 0.0035 + 0.25 * x * x;
}

/** Weak-field point lens: angle of the primary image for a source at angle beta, θ = (β + √(β² + 4θE²)) / 2. */
export function lensAngle(beta, distLens, distSource) {
  if (distSource <= distLens) return beta;
  const thE2 = (2 * (distSource - distLens)) / (distLens * distSource);
  return 0.5 * (beta + Math.sqrt(beta * beta + 4 * thE2));
}

/** Novikov–Thorne temperature profile, normalised so the peak (r ≈ 4.08) is 1. */
export function diskTemperature(r, rin = 3) {
  const x = Math.max(r / rin, 1);
  return (Math.pow(x, -0.75) * Math.pow(Math.max(1 - 1 / Math.sqrt(x), 0), 0.25)) / 0.488;
}

/** Five eras of Adams & Laughlin, keyed by log10 of the cosmic age in years. */
export const ERAS = [
  { e: -99, key: 'primordial' },
  { e: 5, key: 'stelliferous' },
  { e: 14, key: 'degenerate' },
  { e: 40, key: 'blackHole' },
  { e: 100, key: 'dark' },
];
export const eraOf = E => ERAS.reduce((found, era) => (E >= era.e ? era : found), ERAS[0]).key;

/** Disk temperature multiplier: steady through the stelliferous era, cooling to embers, gone after 10^106 years. */
export function diskHeat(E) {
  if (E < 14) return 1;
  if (E < 100) return 1 - 0.82 * Math.pow((E - 14) / 86, 0.7);
  return lerp(0.18, 0.035, smooth(100, 106, E));
}
/** Proton decay dissolves the sand and the brass between 10^30 and 10^41 years. */
export const dustDecay = E => smooth(30, 40, E);
export const gearDecay = E => smooth(31, 41, E);

/** A falling moment, as seen from far away: slows and freezes on the horizon (coordinate time). */
export function fallStep(m, dt) {
  const f = Math.max(1 - 1 / m.r, 1e-6);
  const r = Math.max(1.0005, m.r - (0.3 + 4.2 / m.r) * Math.pow(f, 1.6) * dt);
  return { r, phi: m.phi + (m.L / (m.r * m.r)) * f * f * dt };
}

export function formatClock(s) {
  s = ((s % 43200) + 43200) % 43200;
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = Math.floor(s % 60);
  return `${String(h === 0 ? 12 : h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}
export function formatTau(s) {
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${x.toFixed(1).padStart(4, '0')}`;
}
export function roman(n) {
  let s = '';
  for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; }
  return s;
}
