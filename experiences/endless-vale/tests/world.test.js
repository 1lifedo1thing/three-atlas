import test from 'node:test';
import assert from 'node:assert/strict';
import { hash3, createNoise2D } from '../src/noise.js';
import { sampleTerrain, heightAt, pathX, pathSlope, riverHalfWidth, biomeAt, landAt, WATER_Y, BIOME_LENGTH } from '../src/world.js';
import { buildTile, tileIndex } from '../src/tiles.js';

test('噪声与哈希在同一输入下结果稳定', () => {
  assert.equal(hash3(1, 2, 3), hash3(1, 2, 3));
  assert.notEqual(hash3(1, 2, 3), hash3(3, 2, 1));
  const a = createNoise2D(7), b = createNoise2D(7);
  for (const [x, y] of [[0.1, 0.2], [123.4, -98.7], [1e4, 3e3]]) {
    assert.equal(a(x, y), b(x, y));
    assert.ok(Math.abs(a(x, y)) <= 1.01);
  }
});

test('地形是世界坐标的纯函数：往回飞看到同一片山谷', () => {
  const points = [[12, -40], [-300, -2500], [800, -9000]];
  const first = points.map(([x, z]) => heightAt(x, z));
  heightAt(5, 5); heightAt(-1e4, 2e4);
  assert.deepEqual(points.map(([x, z]) => heightAt(x, z)), first);
});

test('河道始终在水面以下，两岸始终露出水面', () => {
  for (let s = 0; s < 40000; s += 137) {
    const x = pathX(s), rw = riverHalfWidth(s);
    assert.ok(sampleTerrain(x, -s).h < WATER_Y - 1.5, `河心在 ${s} m 处太浅`);
    for (const side of [-1, 1]) assert.ok(heightAt(x + side * (rw + 9), -s) > WATER_Y + 0.4, `河岸在 ${s} m 处被淹没`);
  }
});

test('河流平滑转弯，坡度有上限', () => {
  for (let s = 0; s < 20000; s += 25) assert.ok(Math.abs(pathSlope(s)) < 0.6);
  // Derivative matches the path itself.
  const s = 1234, numeric = (pathX(s + 0.01) - pathX(s - 0.01)) / 0.02;
  assert.ok(Math.abs(numeric - pathSlope(s)) < 1e-4);
});

test('四种地貌按里程轮流出现，起点是金色草甸', () => {
  assert.deepEqual(Array.from(landAt(0)), [1, 0, 0, 0]);
  const seen = new Set();
  for (let s = 0; s < BIOME_LENGTH * 4.2; s += 50) {
    const w = biomeAt(pathX(s), -s);
    assert.ok(Math.abs(w[0] + w[1] + w[2] + w[3] - 1) < 1e-6);
    seen.add(w.indexOf(Math.max(...w)));
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
});

test('地形块边缘与相邻块共享高度，裙边向下不留缝', () => {
  const size = 64, res = 16, a = buildTile(0, -64, size, res), b = buildTile(64, -64, size, res);
  const n = res + 1;
  for (let j = 0; j < n; j++) {
    const right = (j * n + res) * 3 + 1, left = (j * n) * 3 + 1;
    assert.ok(Math.abs(a.position[right] - b.position[left]) < 1e-4);
  }
  const index = tileIndex(res);
  assert.equal(index.length, res * res * 6 + res * 4 * 6);
  const skirtY = a.position[(n * n) * 3 + 1];
  assert.ok(skirtY < a.position[1]);
});

test('河段地形块带有水面，水深来自地形', () => {
  const s = 300, x = pathX(s), tile = buildTile(Math.floor(x / 64) * 64, Math.floor(-s / 64) * 64, 64, 32);
  assert.ok(tile.water, '河段应生成水面');
  assert.ok(Math.max(...tile.water.depth) > 1.5);
  assert.ok(tile.water.index.length > 0);
});
