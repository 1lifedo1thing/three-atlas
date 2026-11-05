import test from 'node:test';
import assert from 'node:assert/strict';
import { Flight, CRUISE, MAX_SPEED, MIN_SPEED } from '../src/flight.js';
import { heightAt, pathX, riverHalfWidth, WATER_Y } from '../src/world.js';
import { sampleTime, sunDirection, forwardHours, clock, wrapHour, PRESETS, START_HOUR } from '../src/time.js';

const run = (flight, seconds, options) => { for (let t = 0; t < seconds; t += 1 / 60) flight.update(1 / 60, options); return flight; };

test('默认以巡航速度一直向前', () => {
  const flight = run(new Flight(), 10);
  assert.ok(Math.abs(flight.speed - CRUISE) < 0.5);
  assert.ok(flight.s > CRUISE * 8);
});

test('滚动加速后慢慢回到巡航；速度有上下限', () => {
  const flight = new Flight();
  flight.impulse(500); run(flight, 1.5);
  assert.ok(flight.speed > CRUISE * 2);
  run(flight, 12);
  assert.ok(Math.abs(flight.speed - CRUISE) < 2);
  flight.impulse(1e6); run(flight, 3);
  assert.ok(flight.speed <= MAX_SPEED + 1e-6);
  // Holding the brake (down arrow or a long upward scroll) glides backwards.
  flight.keys.down = 1; run(flight, 4);
  assert.ok(flight.speed >= MIN_SPEED - 1e-6 && flight.speed < 0, '可以反向滑行');
  flight.keys.down = 0; run(flight, 10);
  assert.ok(flight.speed > 0, '松开后回到前进');
});

test('暂停时停下，减少动态效果时默认不自动飞行', () => {
  const flight = run(new Flight(), 2);
  run(flight, 6, { paused: true });
  assert.equal(flight.speed, 0);
  const calm = run(new Flight({ reduced: true }), 5);
  assert.equal(calm.speed, 0);
  assert.equal(calm.roll, 0);
  assert.ok(Math.abs(calm.fov - calm.baseFov) < 1e-6);
});

test('相机始终在地面和水面之上，左右平移不越过河岸', () => {
  const flight = new Flight();
  flight.keys.right = 1;
  flight.impulse(80);
  for (let i = 0; i < 60 * 40; i++) {
    flight.update(1 / 60);
    const { x, y, z } = flight.position;
    assert.ok(y > Math.max(heightAt(x, z), WATER_Y) + 3, `相机在 ${flight.s.toFixed(0)} m 处太低`);
    assert.ok(Math.abs(flight.offset) <= riverHalfWidth(flight.s), '偏移越过河岸');
  }
  assert.ok(Math.abs(flight.position.x - pathX(flight.s)) > 2, '右移有效');
});

test('昼夜：颜色平滑循环，太阳在黄昏低垂、夜里落下', () => {
  const a = sampleTime(23.999), b = sampleTime(0);
  for (const key of ['zenith', 'horizon', 'fog', 'sun']) for (let c = 0; c < 3; c++) assert.ok(Math.abs(a[key][c] - b[key][c]) < 0.01);
  assert.ok(sunDirection(12)[1] > 0.6);
  assert.ok(sunDirection(START_HOUR)[1] > 0 && sunDirection(START_HOUR)[1] < 0.3, '开场是低垂的夕阳');
  assert.ok(sunDirection(PRESETS.night)[1] < 0);
  assert.ok(sunDirection(START_HOUR)[2] < 0, '太阳在飞行前方');
  assert.equal(sampleTime(PRESETS.night).night, 1);
  assert.equal(sampleTime(PRESETS.day).night, 0);
  assert.ok(sampleTime(PRESETS.night).lightDir[1] > 0, '夜里由月光照明');
});

test('时间只向前切换，时钟格式正确', () => {
  assert.equal(forwardHours(22, 6.5), 8.5);
  assert.equal(forwardHours(6, 18), 12);
  assert.equal(wrapHour(-1), 23);
  assert.equal(clock(17.3), '17:18');
  assert.equal(clock(24.5), '00:30');
});
