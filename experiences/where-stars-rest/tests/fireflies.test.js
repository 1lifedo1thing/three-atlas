import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { sampleFirefly, sampleSwarmCenter } from '../src/fireflies.js';

test('萤火虫围绕各自移动的群心聚散，轨迹连续且没有无效坐标', () => {
  for (let flock = 0; flock < 4; flock++) {
    const start = sampleSwarmCenter(0, flock);
    assert.ok(start.distanceTo(sampleSwarmCenter(3, flock)) > 1);
    for (const t of [0, .5, 4, 15, 60, 300]) {
      const center = sampleSwarmCenter(t, flock);
      for (const seed of [0, .17, .38, .64, .91]) {
        const position = sampleFirefly(t, flock, seed);
        assert.ok(position.toArray().every(Number.isFinite));
        assert.ok(position.distanceTo(center) < 1.3, '萤火虫应聚在同一群心附近');
        const next = sampleFirefly(t + 1 / 60, flock, seed);
        assert.ok(position.distanceTo(next) < .1, '相邻帧轨迹不应跳跃');
        const target = new Vector3();
        assert.equal(sampleFirefly(t, flock, seed, target), target);
        assert.deepEqual(target.toArray(), position.toArray(), '相同时间的轨迹应可复现');
      }
    }
  }
});
