// Grass tufts and flowers, rolled by travelling gusts of wind.
import { BufferAttribute, DoubleSide, InstancedBufferGeometry, InstancedInterleavedBuffer, InterleavedBufferAttribute, Mesh, ShaderMaterial, Sphere, Vector3 } from 'three';
import { ATMOSPHERE, atmosphere } from './atmosphere.js';
import { lighting } from './materials.js';
import { GRASS_CELL, GRASS_STRIDE } from './scatter.js';
import { LAYER_NO_REFLECTION } from './water.js';

/** Three blades per tuft, each a tapered strip of three triangles. */
function tuftGeometry() {
  const pos = [], lean = [];
  for (let b = 0; b < 3; b++) {
    const a = b * 2.094 + 0.3, c = Math.cos(a), s = Math.sin(a), lc = Math.cos(a + 1.571), ls = Math.sin(a + 1.571);
    const v = [[-1, 0], [1, 0], [-0.62, 0.5], [0.62, 0.5], [0, 1]];
    for (const tri of [[0, 1, 2], [1, 3, 2], [2, 3, 4]]) for (const k of tri) {
      const [x, y] = v[k];
      pos.push(x * c, y, x * s); lean.push(lc, ls);
    }
  }
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aLean', new BufferAttribute(new Float32Array(lean), 2));
  return g;
}

export function grassMaterial(range) {
  return new ShaderMaterial({
    side: DoubleSide,
    uniforms: { ...atmosphere, ...lighting, uRange: { value: range } },
    vertexShader: /* glsl */ `
      attribute vec2 aLean;
      attribute vec3 iPos;
      attribute vec4 iParams;
      attribute vec3 iBase;
      attribute vec3 iTip;
      uniform float uTime;
      uniform float uWind;
      uniform float uRange;
      varying vec3 vColor;
      varying vec3 vWorldPos;
      varying float vT;
      void main() {
        float t = position.y;
        float c = cos(iParams.x), s = sin(iParams.x);
        mat2 R = mat2(c, -s, s, c);
        vec2 local = R * (position.xz * iParams.z * 0.055);
        vec2 leanDir = R * aLean;
        float dist = length(iPos.xz - cameraPosition.xz);
        float h = iParams.y * (1.0 - smoothstep(uRange * 0.7, uRange, dist));
        vec2 windDir = vec2(0.8, -0.6);
        float wave = sin(dot(iPos.xz, windDir) * 0.11 - uTime * 1.8 + sin(iPos.x * 0.021 + uTime * 0.2) * 2.0);
        float gust = 0.5 + 0.5 * wave;
        float flutter = sin(uTime * 3.7 + iPos.x * 1.7 + iPos.z * 1.3) * 0.12;
        vec2 bend = leanDir * iParams.w + windDir * (gust * 0.75 + flutter) * uWind;
        float tt = t * t;
        vec3 p = iPos + vec3(local.x + leanDir.x * 0.07 + bend.x * tt * h, t * h * (1.0 - 0.3 * tt * min(length(bend), 1.0)), local.y + leanDir.y * 0.07 + bend.y * tt * h);
        vWorldPos = p;
        vT = t;
        vColor = mix(iBase, iTip, smoothstep(0.05, 0.95, t)) * (0.88 + 0.3 * gust * t * uWind);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uKeyLight;
      uniform vec3 uLightDir;
      uniform vec3 uSkyFill;
      uniform vec3 uGroundFill;
      varying vec3 vColor;
      varying vec3 vWorldPos;
      varying float vT;
      ${ATMOSPHERE}
      void main() {
        vec3 view = normalize(vWorldPos - cameraPosition);
        float up = 0.35 + 0.65 * vT;
        vec3 ambient = mix(uGroundFill, uSkyFill, up);
        // Blades stand upright, so a low sun lights them more than the ground beneath.
        float facing = 0.35 + 0.45 * (1.0 - clamp(uLightDir.y, 0.0, 1.0)) + 0.2 * clamp(uLightDir.y, 0.0, 1.0);
        vec3 direct = uKeyLight * facing * up * 0.42;
        vec3 through = uKeyLight * pow(max(dot(view, uSunDir), 0.0), 3.0) * vT * vT * 0.9;
        vec3 color = vColor * (ambient + direct + through);
        gl_FragColor = vec4(applyAtmosphere(color, vWorldPos), 1.0);
      }`,
  });
}

/** One mesh per grass cell; instances come packed from the worker. */
export class GrassField {
  constructor(scene, range) {
    this.scene = scene; this.range = range;
    this.base = tuftGeometry();
    this.material = grassMaterial(range);
    this.meshes = new Map();
  }
  add(key, cx, cz, data) {
    if (this.meshes.has(key) || !data.length) return;
    const g = new InstancedBufferGeometry();
    g.index = null;
    // Each cell owns its copy of the small tuft so disposing one never frees another's buffers.
    g.setAttribute('position', this.base.attributes.position.clone());
    g.setAttribute('aLean', this.base.attributes.aLean.clone());
    const buffer = new InstancedInterleavedBuffer(data, GRASS_STRIDE, 1);
    g.setAttribute('iPos', new InterleavedBufferAttribute(buffer, 3, 0));
    g.setAttribute('iParams', new InterleavedBufferAttribute(buffer, 4, 3));
    g.setAttribute('iBase', new InterleavedBufferAttribute(buffer, 3, 7));
    g.setAttribute('iTip', new InterleavedBufferAttribute(buffer, 3, 10));
    g.instanceCount = data.length / GRASS_STRIDE;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 1; i < data.length; i += GRASS_STRIDE) { minY = Math.min(minY, data[i]); maxY = Math.max(maxY, data[i]); }
    g.boundingSphere = new Sphere(new Vector3((cx + 0.5) * GRASS_CELL, (minY + maxY) / 2 + 0.6, (cz + 0.5) * GRASS_CELL), GRASS_CELL * 0.75 + (maxY - minY) / 2 + 1.5);
    const mesh = new Mesh(g, this.material);
    mesh.layers.set(LAYER_NO_REFLECTION);
    mesh.matrixAutoUpdate = false;
    this.scene.add(mesh);
    this.meshes.set(key, mesh);
  }
  remove(key) {
    const mesh = this.meshes.get(key);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    this.meshes.delete(key);
  }
  get count() { let n = 0; for (const m of this.meshes.values()) n += m.geometry.instanceCount; return n; }
  dispose() { for (const key of [...this.meshes.keys()]) this.remove(key); this.base.dispose(); this.material.dispose(); }
}
