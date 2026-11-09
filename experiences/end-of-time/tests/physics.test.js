import test from 'node:test';
import assert from 'node:assert/strict';
import {
  B_CRIT, R_MIN, R_HOME, E_NOW, E_PLANCK, dilation, gammaAt, shadowAngle, clockMultiplier, epochRate, lensAngle,
  diskTemperature, eraOf, diskHeat, dustDecay, gearDecay, fallStep, formatClock, formatTau, roman,
} from '../src/physics.js';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('时间膨胀是静止观察者的真实值', () => {
  close(dilation(4), Math.sqrt(0.75));
  close(dilation(R_HOME), 0.9837);
  close(gammaAt(2) * dilation(2), 1);
  assert.equal(dilation(1), 0);
  assert.ok(Number.isFinite(gammaAt(1)), '视界上不能出现无穷大');
});

test('阴影角半径：远处趋近 b_c/r，光子球上为 90°，视界附近接近 180°', () => {
  close(B_CRIT, 2.598, 1e-3);
  close(shadowAngle(1000), Math.asin((B_CRIT * Math.sqrt(1 - 1 / 1000)) / 1000), 1e-9);
  close(shadowAngle(1.5), Math.PI / 2, 1e-6);
  assert.ok(shadowAngle(1.01) > Math.PI * 0.85);
  for (let r = 1.01; r < 60; r *= 1.1) assert.ok(shadowAngle(r) > shadowAngle(r * 1.1), '越近阴影越大');
});

test('外部时钟与宇宙年龄随深度单调加速', () => {
  close(clockMultiplier(R_HOME), Math.exp((gammaAt(R_HOME) - 1) * 10));
  assert.ok(clockMultiplier(R_HOME) < 1.3);
  assert.ok(clockMultiplier(R_MIN) > 1e3);
  assert.ok(clockMultiplier(1.0001) <= 1e7);
  for (let r = 1.05; r < 60; r *= 1.2) assert.ok(epochRate(r) > epochRate(r * 1.2));
  assert.ok(epochRate(R_HOME) < 0.02, '待在起点时宇宙老得很慢');
});

test('弱场透镜：像总在源的外侧，且源越远偏折越大', () => {
  assert.equal(lensAngle(0.1, 30, 20), 0.1, '透镜前方的物体不偏折');
  const near = lensAngle(0.05, 30, 35), far = lensAngle(0.05, 30, 80);
  assert.ok(near > 0.05 && far > near);
  close(lensAngle(0, 30, 60), Math.sqrt((2 * 30) / (30 * 60)), 1e-9); // 正后方的源成爱因斯坦环
});

test('吸积盘温度：最内稳定轨道为零，峰值约在 4.08 rₛ', () => {
  close(diskTemperature(3), 0, 1e-2);
  let best = 0, at = 0;
  for (let r = 3; r < 16; r += 0.01) { const v = diskTemperature(r); if (v > best) { best = v; at = r; } }
  close(best, 1, 2e-3); close(at, 4.08, 0.05);
});

test('五个纪元与宇宙的结局', () => {
  assert.equal(eraOf(E_PLANCK), 'primordial');
  assert.equal(eraOf(E_NOW), 'stelliferous');
  assert.equal(eraOf(20), 'degenerate');
  assert.equal(eraOf(60), 'blackHole');
  assert.equal(eraOf(120), 'dark');
  assert.equal(diskHeat(E_NOW), 1);
  assert.ok(diskHeat(60) < 1 && diskHeat(60) > diskHeat(99));
  assert.ok(diskHeat(110) < 0.05);
  assert.equal(dustDecay(20), 0); assert.equal(dustDecay(45), 1);
  assert.ok(gearDecay(35) < dustDecay(35), '齿轮比尘埃晚一点溶解');
});

test('从外面看，下落的瞬间永远到不了视界', () => {
  let m = { r: 15, phi: 0, L: 3 * Math.sqrt(15) };
  let t = 0;
  while (m.r > 1.2 && t < 120) { m = { ...m, ...fallStep(m, 1 / 60) }; t += 1 / 60; }
  assert.ok(t > 5 && t < 60, `下落时间 ${t.toFixed(1)} 秒`);
  const before = m.r;
  for (let i = 0; i < 60 * 600; i++) m = { ...m, ...fallStep(m, 1 / 60) };
  assert.ok(m.r > 1 && m.r < before, '越来越慢，但不越过视界');
});

test('读数格式', () => {
  assert.equal(formatClock(0), '12:00:00');
  assert.equal(formatClock(3661), '01:01:01');
  assert.equal(formatClock(-1), '11:59:59');
  assert.equal(formatTau(83.25), '00:01:23.3');
  assert.equal(roman(4), 'IV'); assert.equal(roman(19), 'XIX');
});
