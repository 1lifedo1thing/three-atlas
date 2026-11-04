import test from 'node:test';
import assert from 'node:assert/strict';
import { CatmullRomCurve3, Vector3 } from 'three';
import { boundary, heightAt, insideIsland, random, taperedTube } from '../src/math.js';
import { createIsland } from '../src/island.js';
import { createTree } from '../src/tree.js';

test('同一种子可复现；岛屿边界内外与表面高度一致', () => {
  const a = random(22), b = random(22);
  assert.deepEqual(Array.from({ length: 30 }, a), Array.from({ length: 30 }, b));
  for (let i = 0; i < 100; i++) {
    const angle = i / 100 * Math.PI * 2, r = boundary(angle);
    assert.ok(insideIsland(Math.cos(angle) * (r - .01), Math.sin(angle) * (r - .01) * .84));
    assert.ok(!insideIsland(Math.cos(angle) * (r + .01), Math.sin(angle) * (r + .01) * .84));
    assert.ok(Number.isFinite(heightAt(Math.cos(angle) * r, Math.sin(angle) * r)));
  }
});

test('渐细枝条的法线朝外，避免树干背面剔除与照明反转', () => {
  const line = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 2, 0)]);
  const geometry = taperedTube(line, .2, 20, 9);
  const positions = geometry.attributes.position, normals = geometry.attributes.normal;
  for (let i = 0; i < positions.count; i++) {
    const outward = positions.getX(i) * normals.getX(i) + positions.getZ(i) * normals.getZ(i);
    assert.ok(outward > 0, `normal ${i} points into the branch`);
  }
  geometry.dispose();
});

function validateGeometry(group) {
  const geometries = new Set(), materials = new Set();
  group.updateMatrixWorld(true);
  group.traverse(object => {
    if (object.geometry) {
      geometries.add(object.geometry);
      for (const [name, attribute] of Object.entries(object.geometry.attributes)) {
        assert.ok(attribute.count > 0, `${name} is empty`);
        assert.ok(attribute.array.every(Number.isFinite), `${name} contains NaN or Infinity`);
      }
      if (object.geometry.index) assert.ok(object.geometry.index.array.every(i => i < object.geometry.attributes.position.count));
      object.geometry.computeBoundingSphere();
      assert.ok(Number.isFinite(object.geometry.boundingSphere.radius));
    }
    if (object.isInstancedMesh) {
      assert.ok(object.count > 0);
      assert.ok(object.instanceMatrix.array.every(Number.isFinite));
      assert.ok(object.boundingSphere === null || Number.isFinite(object.boundingSphere.radius));
      object.dispose();
    }
    if (object.material) materials.add(object.material);
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

test('程序岛屿的表面朝上，桌面与移动几何均无无效顶点', () => {
  for (const compact of [true, false]) {
    const island = createIsland({ time: { value: 0 }, compact });
    const top = island.group.children[0].geometry;
    for (let i = 0; i < top.attributes.normal.count; i++) assert.ok(top.attributes.normal.getY(i) > .9);
    island.update(12);
    const fragment = island.group.children.at(-1), angle = fragment.rotation.y;
    island.update(12);
    assert.equal(fragment.rotation.y, angle, '碎岩动画由时间决定，不依赖调用次数');
    validateGeometry(island.group);
  }
});

test('树冠有独立叶片，实例矩阵有效，根部与地面贴合', () => {
  for (const compact of [true, false]) {
    const tree = createTree({ time: { value: 0 }, compact });
    assert.equal(tree.group.position.y, heightAt(-.22, -.18));
    const leaves = tree.group.children.find(object => object.isInstancedMesh);
    assert.equal(leaves.count, compact ? 8200 : 13500);
    assert.ok(leaves.boundingSphere.radius > 2);
    tree.update(18, .5);
    validateGeometry(tree.group);
  }
});
