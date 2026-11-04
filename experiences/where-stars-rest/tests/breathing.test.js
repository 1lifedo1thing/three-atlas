import test from 'node:test';
import assert from 'node:assert/strict';
import { BREATH_PERIOD, sampleBreathing } from '../src/math.js';
import { windMaterial } from '../src/materials.js';
import { createFireflies } from '../src/fireflies.js';
import { createLightRig } from '../src/light-rig.js';
import { createClouds } from '../src/clouds.js';

function disposeGroup(group) {
  const geometries = new Set(), materials = new Set();
  group.traverse(item => {
    if (item.geometry) geometries.add(item.geometry);
    if (item.material) materials.add(item.material);
  });
  geometries.forEach(item => item.dispose());
  materials.forEach(item => item.dispose());
}

test('呼吸包络有平滑的吸气与呼气，跨周期连续且始终处于有效范围', () => {
  assert.equal(sampleBreathing(0), 0);
  assert.equal(sampleBreathing(BREATH_PERIOD), 0);
  assert.ok(sampleBreathing(3.2) > .999);
  for (let t = -20; t < 60; t += .013) {
    const value = sampleBreathing(t);
    assert.ok(value >= 0 && value <= 1);
    assert.ok(Math.abs(value - sampleBreathing(t + BREATH_PERIOD)) < 1e-10);
    assert.ok(Math.abs(value - sampleBreathing(t + 1 / 60)) < .012);
  }
});

test('树叶、光晕和萤火虫持有同一个呼吸值，避免各自闪烁而失去同步', () => {
  const breath = { value: .4 }, time = { value: 0 };
  const leaf = windMaterial({ time, breath, leaf: true });
  const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <emissivemap_fragment>' };
  leaf.onBeforeCompile(shader);
  const fireflies = createFireflies({ compact: true, pixelRatio: 1, breath });
  const rig = createLightRig(time, breath);
  try {
    assert.equal(shader.uniforms.uBreath, breath);
    assert.equal(fireflies.points.material.uniforms.uBreath, breath);
    const halo = rig.group.children.find(item => item.isPoints);
    assert.equal(halo.material.uniforms.uBreath, breath);
    breath.value = 1;
    assert.equal(shader.uniforms.uBreath.value, 1);
    assert.equal(halo.material.uniforms.uBreath.value, 1);
  } finally {
    leaf.dispose(); disposeGroup(fireflies.points); disposeGroup(rig.group);
  }
});

test('云层的发射位置都在岛底以下，避免重新遮住树木与岛面', () => {
  const clouds = createClouds({ value: 0 }, 1);
  try {
    const positions = clouds.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) assert.ok(positions.getY(i) < -3.4);
  } finally {
    clouds.geometry.dispose(); clouds.material.dispose();
  }
});
