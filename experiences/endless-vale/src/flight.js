// The flight: an endless glide along the river, throttled by scrolling, steered by drag and keys.
// Pure numbers so it can be tested without a browser.
import { heightAt, pathX, pathSlope, riverHalfWidth, WATER_Y } from './world.js';

export const CRUISE = 14;          // m/s, about 50 km/h
export const MAX_SPEED = 120;      // m/s with a long scroll
export const MIN_SPEED = -24;      // gentle reverse
export const HOVER = 11.5;          // metres above water or ground

const damp = (current, target, rate, dt) => target + (current - target) * Math.exp(-rate * dt);

export class Flight {
  constructor({ reduced = false, s = 0 } = {}) {
    this.reduced = reduced;
    this.autopilot = !reduced;
    this.s = s; this.speed = this.autopilot ? CRUISE : 0; this.boost = 0;
    this.offset = 0; this.offsetTarget = 0;
    this.yaw = 0; this.pitch = 0; this.lookYaw = 0; this.lookPitch = 0; this.dragYaw = 0; this.dragPitch = 0;
    this.roll = 0; this.fov = 56; this.baseFov = 56; this.basePitch = -0.13;
    this.keys = { up: 0, down: 0, left: 0, right: 0 };
    this.position = { x: pathX(s), y: HOVER + 1, z: -s };
    this.target = { x: 0, y: 0, z: 0 };
    this.y = this.groundTarget();
    this.position.y = this.y;
    this.update(0);
  }

  /** Scroll or swipe: positive moves forward faster, negative slows and reverses. */
  impulse(amount) {
    if (this.reduced && !this.autopilot) { this.boost = 0; this.s += amount * 0.35; return; }
    const cruise = this.autopilot ? CRUISE : 0;
    this.boost = Math.min(Math.max(this.boost + amount, MIN_SPEED - cruise), MAX_SPEED - cruise);
  }

  /** Pointer position in [-1, 1] for gentle look-around; drag adds a larger, springy turn. */
  look(x, y) { this.lookYaw = -x * 0.16; this.lookPitch = -y * 0.07; }
  drag(dx, dy) {
    this.dragYaw = Math.min(Math.max(this.dragYaw - dx * 0.0042, -1.1), 1.1);
    this.dragPitch = Math.min(Math.max(this.dragPitch - dy * 0.003, -0.35), 0.45);
  }

  groundTarget() {
    const lateral = this.position.x - pathX(this.s);
    let ground = Math.max(heightAt(this.position.x, -this.s), WATER_Y);
    for (const ahead of [14, 32, 60]) {
      const t = this.s + ahead * Math.sign(this.speed || 1);
      ground = Math.max(ground, heightAt(pathX(t) + lateral, -t) - ahead * 0.06);
    }
    return ground + HOVER + Math.sin(this.s * 0.0045) * 2.2 + Math.sin(this.s * 0.011 + 1) * 0.8;
  }

  update(dt, { paused = false } = {}) {
    const cruise = this.autopilot && !paused ? CRUISE : 0;
    const k = this.keys;
    if (k.up || k.down) this.impulse((k.up - k.down) * 46 * dt);
    this.boost = damp(this.boost, 0, 0.55, dt);
    const target = paused ? 0 : cruise + this.boost;
    this.speed = damp(this.speed, target, this.reduced ? 6 : 2.4, dt);
    if (Math.abs(this.speed) < 0.01 && target === 0) this.speed = 0;
    this.s += this.speed * dt;

    const rw = riverHalfWidth(this.s);
    if (k.left || k.right) this.offsetTarget = Math.min(Math.max(this.offsetTarget + (k.right - k.left) * 16 * dt, -(rw - 2.5)), rw - 2.5);
    this.offsetTarget = Math.min(Math.max(this.offsetTarget, -(rw - 2.5)), rw - 2.5);
    const previousOffset = this.offset;
    this.offset = damp(this.offset, this.offsetTarget, 1.6, dt);

    // Drag springs back slowly when released.
    if (!this.dragging) { this.dragYaw = damp(this.dragYaw, 0, 0.6, dt); this.dragPitch = damp(this.dragPitch, 0, 0.8, dt); }
    this.yaw = damp(this.yaw, this.lookYaw + this.dragYaw, 3.2, dt);
    this.pitch = damp(this.pitch, this.lookPitch + this.dragPitch, 3.2, dt);

    const slope = pathSlope(this.s), n = Math.hypot(1, slope);
    const px = pathX(this.s) + this.offset / n;
    this.position.x = px; this.position.z = -this.s;
    const ground = this.groundTarget();
    this.y = dt > 0 ? damp(this.y, ground, 1.3, dt) : ground;
    const floor = Math.max(heightAt(px, -this.s), WATER_Y) + 3.5;
    if (this.y < floor) this.y = floor;
    this.position.y = this.y;

    // Look along the river ahead, then add the visitor's yaw and pitch.
    const ahead = 42, ta = this.s + ahead;
    let dx = pathX(ta) + this.offset * 0.6 - px, dz = -ahead;
    const len = Math.hypot(dx, dz); dx /= len; dz /= len;
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    const fx = dx * c + dz * s, fz = -dx * s + dz * c;
    const pitch = this.basePitch + this.pitch;
    this.target.x = px + fx * 40; this.target.z = -this.s + fz * 40; this.target.y = this.y + Math.tan(pitch) * 40;

    // Bank into the river's bends and into lateral moves; widen the view with speed.
    const curvature = (pathSlope(this.s + 30) - slope) / 30;
    const lateralVelocity = dt > 0 ? (this.offset - previousOffset) / dt : 0;
    const motion = this.reduced ? 0 : 1;
    this.roll = damp(this.roll, motion * (-curvature * Math.max(this.speed, 0) * 2.4 - lateralVelocity * 0.012), 2, dt);
    const fast = Math.min(Math.max((this.speed - CRUISE) / 70, 0), 1);
    this.fov = damp(this.fov, this.baseFov + motion * fast * 16, 2.5, dt);
    this.fast = fast;
    return this;
  }

  /** Keep at least ~44° of horizontal view on tall screens. */
  frame(aspect) {
    const fit = (2 * Math.atan(Math.tan((22 * Math.PI) / 180) / aspect) * 180) / Math.PI;
    this.baseFov = Math.min(Math.max(56, fit), 76);
    this.basePitch = aspect < 1 ? -0.075 : -0.13;
    if (!this.fovSet) { this.fov = this.baseFov; this.fovSet = true; }
  }

  get kmh() { return Math.abs(this.speed) * 3.6; }
}
