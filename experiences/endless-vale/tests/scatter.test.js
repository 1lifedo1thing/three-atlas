import test from 'node:test';
import assert from 'node:assert/strict';
import { scatterCell, scatterGrass, gateAfter, PROP_TYPES, CELL, GRASS_STRIDE, GATE_SPACING } from '../src/scatter.js';
import { pathX, riverHalfWidth, heightAt, WATER_Y } from '../src/world.js';

const cellAt = s => [Math.floor(pathX(s) / CELL), Math.floor(-s / CELL)];
const positions = ({ matrices, count }) => Array.from({ length: count }, (_, i) => [matrices[i * 16 + 12], matrices[i * 16 + 13], matrices[i * 16 + 14]]);

test('同一格子每次生成完全相同的物件', () => {
  const [cx, cz] = cellAt(700);
  const a = scatterCell(cx, cz), b = scatterCell(cx, cz);
  for (const type of PROP_TYPES) {
    assert.equal(a[type].count, b[type].count);
    assert.deepEqual(Array.from(a[type].matrices), Array.from(b[type].matrices));
  }
});

test('河道里不长树，也没有村舍；树与房子都在岸上', () => {
  let trees = 0;
  for (let s = 100; s < 6000; s += 380) {
    for (const dx of [-1, 0, 1]) {
      const [cx, cz] = cellAt(s), props = scatterCell(cx + dx, cz);
      for (const type of ['treeRound', 'treeCone', 'cottage']) for (const [x, y, z] of positions(props[type])) {
        const t = -z, lateral = Math.abs(x - pathX(t));
        assert.ok(lateral > riverHalfWidth(t) + 1, `${type} 太靠近河心：${lateral.toFixed(1)} m`);
        assert.ok(heightAt(x, z) > WATER_Y + 0.4, `${type} 在水里`);
        if (type !== 'cottage') trees++;
      }
    }
  }
  assert.ok(trees > 200, `树太少：${trees}`);
});

test('石门横跨河流，飞行高度从门梁下穿过', () => {
  const t = gateAfter(0);
  assert.ok(t > 0 && t < GATE_SPACING + 700);
  const [cx, cz] = cellAt(t), props = scatterCell(cx, cz);
  assert.equal(props.gatePillar.count, 2);
  assert.equal(props.gateBeam.count, 1);
  const [[ax], [bx]] = positions(props.gatePillar);
  const center = pathX(t), rw = riverHalfWidth(t);
  assert.ok(Math.min(ax, bx) < center - rw && Math.max(ax, bx) > center + rw, '两根门柱应分立两岸');
  // The beam is modelled 22 m above its base; the flight hovers about 12 m above the water.
  assert.ok(positions(props.gateBeam)[0][1] + 21 > 16);
  assert.ok(gateAfter(t) - t >= GATE_SPACING - 240);
});

test('草丛数据按步长打包，并落在陆地上', () => {
  const [cx] = cellAt(400), cz = Math.floor(-400 / 32), gx = Math.floor((pathX(400) + 40) / 32);
  const grass = scatterGrass(gx, cz);
  assert.equal(grass.length % GRASS_STRIDE, 0);
  assert.ok(grass.length / GRASS_STRIDE > 200);
  for (let i = 0; i < grass.length; i += GRASS_STRIDE * 37) {
    assert.ok(grass[i + 1] > WATER_Y);
    assert.ok(grass[i + 4] > 0.1 && grass[i + 4] < 3);
  }
  assert.ok(cx !== undefined);
  assert.deepEqual(Array.from(scatterGrass(gx, cz, 0.5)).length < grass.length, true);
});
