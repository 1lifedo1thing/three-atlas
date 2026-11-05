// Streams the valley around the camera: a quadtree of terrain tiles, instanced props per 64 m cell,
// and grass per 32 m cell. Old pieces stay on screen until their replacements are ready.
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Mesh, Sphere, Vector3 } from 'three';
import { tileIndex } from './tiles.js';
import { CELL, GRASS_CELL, PROP_TYPES } from './scatter.js';
import { MODELS, FAR_MODELS, LOOKS } from './props.js';
import { propMaterial, terrainMaterial } from './materials.js';
import { waterMaterial, LAYER_NO_REFLECTION } from './water.js';
import { GrassField } from './grass.js';

const ROOT = 512, NEAR = 210;
const CAPACITY = { treeRound: 4096, treeCone: 2048, rock: 2048, crystal: 1024, pillar: 512, gatePillar: 16, gateBeam: 8, lantern: 512, cottage: 1024, island: 128 };

function rectDistance(px, pz, x0, z0, size) {
  const dx = Math.max(x0 - px, 0, px - (x0 + size)), dz = Math.max(z0 - pz, 0, pz - (z0 + size));
  return Math.hypot(dx, dz);
}
const overlaps = (a, b) => a.x0 < b.x0 + b.size && b.x0 < a.x0 + a.size && a.z0 < b.z0 + b.size && b.z0 < a.z0 + a.size;

export class Land {
  constructor(scene, streamer, { reflection, quality }) {
    this.scene = scene; this.streamer = streamer; this.q = quality;
    this.index = new BufferAttribute(tileIndex(quality.tileRes), 1);
    this.terrainMaterial = terrainMaterial();
    this.waterMaterial = waterMaterial(reflection);
    this.tiles = new Map(); this.cells = new Map(); this.grassCells = new Map();
    this.grass = new GrassField(scene, quality.grassRange);
    // Each prop type has a near batch (full detail, casts shadows) and a far batch (lighter model, no shadows).
    this.props = {};
    for (const type of PROP_TYPES) this.props[type] = { near: this.createBatch(type, CAPACITY[type], true), far: this.createBatch(type, CAPACITY[type], false) };
    this.rebuiltAt = new Vector3(Infinity, 0, 0);
    this.dirty = false; this.lastRebuild = 0; this.ready = false; this.version = 0;
    this._cam = new Vector3();
  }

  createBatch(type, capacity, near, previous) {
    const look = LOOKS[type];
    const geometry = previous?.geometry ?? (near ? MODELS[type]() : (FAR_MODELS[type] ?? MODELS[type])());
    const material = previous?.material ?? (near ? propMaterial(look) : this.props?.[type]?.near.material ?? propMaterial(look));
    const mesh = new InstancedMesh(geometry, material, capacity);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(DynamicDrawUsage);
    mesh.count = 0; mesh.frustumCulled = false;
    mesh.castShadow = near && Boolean(look.castShadow) && this.q.shadows; mesh.receiveShadow = this.q.shadows;
    if (previous) { this.scene.remove(previous); previous.dispose(); }
    this.scene.add(mesh);
    return mesh;
  }

  /** Tiles the camera wants right now: finer near the camera, coarser far away; mostly ahead. */
  desiredTiles(cam, fx, fz) {
    const want = new Map(), { range, split } = this.q;
    const visit = (x0, z0, size) => {
      const d = rectDistance(cam.x, cam.z, x0, z0, size);
      if (d > range) return;
      const cx = x0 + size / 2 - cam.x, cz = z0 + size / 2 - cam.z;
      if (cx * fx + cz * fz < -(size * 0.71 + 40)) return;
      if (size > this.q.minTile && d < size * split) {
        const h = size / 2;
        visit(x0, z0, h); visit(x0 + h, z0, h); visit(x0, z0 + h, h); visit(x0 + h, z0 + h, h);
      } else want.set(`${size}:${x0}:${z0}`, { x0, z0, size, d, ahead: cx * fx + cz * fz });
    };
    for (let rz = Math.floor((cam.z - range) / ROOT); rz <= Math.floor((cam.z + range) / ROOT); rz++)
      for (let rx = Math.floor((cam.x - range) / ROOT); rx <= Math.floor((cam.x + range) / ROOT); rx++) visit(rx * ROOT, rz * ROOT, ROOT);
    return want;
  }

  update(camera, forward) {
    const cam = this._cam.copy(camera.position);
    const fl = Math.hypot(forward.x, forward.z) || 1, fx = forward.x / fl, fz = forward.z / fl;
    this.updateTiles(cam, fx, fz);
    this.updateCells(cam, fx, fz);
    this.updateGrass(cam, fx, fz);
    const now = performance.now();
    const moved = Math.hypot(cam.x - this.rebuiltAt.x, cam.z - this.rebuiltAt.z) > 36;
    if ((this.dirty || moved) && now - this.lastRebuild > 250) { this.rebuildProps(); this.lastRebuild = now; this.rebuiltAt.copy(cam); }
    this.streamer.pump();
  }

  updateTiles(cam, fx, fz) {
    const want = this.desiredTiles(cam, fx, fz);
    for (const [key, spec] of want) {
      const priority = spec.d * (spec.ahead < 0 ? 2.5 : 1) + spec.size * 0.05;
      const tile = this.tiles.get(key);
      if (tile) { if (tile.state === 'pending') this.streamer.reprioritize(tile.job, priority); continue; }
      const job = this.streamer.request({ kind: 'tile', x0: spec.x0, z0: spec.z0, size: spec.size, res: this.q.tileRes }, priority);
      this.tiles.set(key, { key, ...spec, state: 'pending', job });
    }
    const old = [], fresh = [];
    for (const tile of this.tiles.values()) {
      tile.wanted = want.has(tile.key); tile.hidden = false;
      if (!tile.wanted && tile.state === 'pending') { tile.job.cancel(); this.tiles.delete(tile.key); continue; }
      (tile.wanted ? fresh : old).push(tile);
    }
    // An old tile stays until every new tile covering its area is ready, and hides those new tiles meanwhile.
    for (const o of old) {
      const cover = fresh.filter(t => overlaps(t, o));
      if (cover.every(t => t.state === 'ready')) this.disposeTile(o);
      else for (const t of cover) t.hidden = true;
    }
    let ready = 0;
    for (const t of fresh) if (t.state === 'ready') {
      ready++;
      if (t.mesh.visible === t.hidden) { this.version++; t.mesh.visible = !t.hidden; if (t.water) t.water.visible = !t.hidden; }
    }
    this.tileProgress = fresh.length ? ready / fresh.length : 1;
  }

  updateCells(cam, fx, fz) {
    const R = this.q.objectRange, want = new Set();
    for (let cz = Math.floor((cam.z - R) / CELL); cz <= Math.floor((cam.z + R) / CELL); cz++)
      for (let cx = Math.floor((cam.x - R) / CELL); cx <= Math.floor((cam.x + R) / CELL); cx++) {
        const dx = (cx + 0.5) * CELL - cam.x, dz = (cz + 0.5) * CELL - cam.z, d = Math.hypot(dx, dz), ahead = dx * fx + dz * fz;
        if (d > R || ahead < -140) continue;
        const key = `${cx}:${cz}`; want.add(key);
        const priority = d * (ahead < 0 ? 2.5 : 1) + 20;
        const cell = this.cells.get(key);
        if (cell) { if (cell.state === 'pending') this.streamer.reprioritize(cell.job, priority); continue; }
        this.cells.set(key, { state: 'pending', job: this.streamer.request({ kind: 'cell', cx, cz }, priority) });
      }
    for (const [key, cell] of this.cells) {
      if (want.has(key)) continue;
      // A little hysteresis keeps cells at the edge from flickering in and out.
      const [cx, cz] = key.split(':').map(Number), d = Math.hypot((cx + 0.5) * CELL - cam.x, (cz + 0.5) * CELL - cam.z);
      if (d < R + 48 && cell.state === 'ready' && ((cx + 0.5) * CELL - cam.x) * fx + ((cz + 0.5) * CELL - cam.z) * fz > -180) continue;
      if (cell.state === 'pending') cell.job.cancel(); else this.dirty = true;
      this.cells.delete(key);
    }
  }

  updateGrass(cam, fx, fz) {
    const R = this.q.grassRange, want = new Set();
    if (this.q.grassDensity <= 0) return;
    for (let cz = Math.floor((cam.z - R) / GRASS_CELL); cz <= Math.floor((cam.z + R) / GRASS_CELL); cz++)
      for (let cx = Math.floor((cam.x - R) / GRASS_CELL); cx <= Math.floor((cam.x + R) / GRASS_CELL); cx++) {
        const dx = (cx + 0.5) * GRASS_CELL - cam.x, dz = (cz + 0.5) * GRASS_CELL - cam.z, d = Math.hypot(dx, dz), ahead = dx * fx + dz * fz;
        if (d > R + 24 || ahead < -40) continue;
        const key = `${cx}:${cz}`; want.add(key);
        if (this.grassCells.has(key)) continue;
        this.grassCells.set(key, { state: 'pending', job: this.streamer.request({ kind: 'grass', cx, cz, density: this.q.grassDensity }, d * 0.8 + 10) });
      }
    for (const [key, cell] of this.grassCells) {
      if (want.has(key)) continue;
      if (cell.state === 'pending') cell.job.cancel(); else { this.grass.remove(key); this.version++; }
      this.grassCells.delete(key);
    }
  }

  onResult(job, data) {
    const m = job.message;
    if (data.kind === 'tile') {
      const tile = this.tiles.get(`${m.size}:${m.x0}:${m.z0}`);
      if (!tile || tile.job !== job) return;
      const { position, normal, color, minH, maxH, water } = data.tile;
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(position, 3));
      g.setAttribute('normal', new BufferAttribute(normal, 3));
      g.setAttribute('color', new BufferAttribute(color, 3));
      g.setIndex(this.index);
      const half = m.size / 2;
      g.boundingSphere = new Sphere(new Vector3(half, (minH + maxH) / 2, half), Math.hypot(half * 1.42, (maxH - minH) / 2 + 8));
      const mesh = new Mesh(g, this.terrainMaterial);
      mesh.position.set(m.x0, 0, m.z0); mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
      mesh.receiveShadow = this.q.shadows; mesh.castShadow = this.q.shadows && m.size <= 128;
      mesh.visible = false;
      this.scene.add(mesh);
      tile.mesh = mesh;
      if (water) {
        const wg = new BufferGeometry();
        wg.setAttribute('position', new BufferAttribute(water.position, 3));
        wg.setAttribute('depth', new BufferAttribute(water.depth, 1));
        wg.setIndex(new BufferAttribute(water.index, 1));
        wg.boundingSphere = new Sphere(new Vector3(half, 0, half), half * 1.42);
        const wm = new Mesh(wg, this.waterMaterial);
        wm.position.copy(mesh.position); wm.updateMatrix(); wm.matrixAutoUpdate = false;
        wm.layers.set(LAYER_NO_REFLECTION); wm.visible = false; wm.renderOrder = 1;
        this.scene.add(wm);
        tile.water = wm;
      }
      tile.state = 'ready';
    } else if (data.kind === 'cell') {
      const key = `${m.cx}:${m.cz}`, cell = this.cells.get(key);
      if (!cell || cell.job !== job) return;
      cell.props = data.props; cell.state = 'ready'; this.dirty = true;
    } else {
      const key = `${m.cx}:${m.cz}`, cell = this.grassCells.get(key);
      if (!cell || cell.job !== job) return;
      cell.state = 'ready';
      this.grass.add(key, m.cx, m.cz, data.grass); this.version++;
    }
  }

  disposeTile(tile) {
    this.tiles.delete(tile.key); this.version++;
    if (tile.mesh) {
      this.scene.remove(tile.mesh);
      tile.mesh.geometry.index = null; // the index is shared by every tile
      tile.mesh.geometry.dispose();
    }
    if (tile.water) { this.scene.remove(tile.water); tile.water.geometry.dispose(); }
  }

  rebuildProps() {
    this.dirty = false;
    const ready = [...this.cells.values()].filter(cell => cell.state === 'ready');
    const cx = this._cam.x, cz = this._cam.z, near2 = NEAR * NEAR;
    for (const type of PROP_TYPES) {
      // Count first so each batch grows at most once.
      let nearCount = 0, farCount = 0;
      for (const cell of ready) {
        const { matrices, count } = cell.props[type];
        for (let i = 0; i < count; i++) {
          const dx = matrices[i * 16 + 12] - cx, dz = matrices[i * 16 + 14] - cz;
          if (dx * dx + dz * dz < near2) nearCount++; else farCount++;
        }
      }
      const batch = this.props[type];
      if (nearCount > batch.near.instanceMatrix.count) batch.near = this.createBatch(type, Math.ceil(nearCount * 1.5), true, batch.near);
      if (farCount > batch.far.instanceMatrix.count) batch.far = this.createBatch(type, Math.ceil(farCount * 1.5), false, batch.far);
      const nm = batch.near.instanceMatrix.array, nc = batch.near.instanceColor.array, fm = batch.far.instanceMatrix.array, fc = batch.far.instanceColor.array;
      let n = 0, f = 0;
      for (const cell of ready) {
        const { matrices, colors, count } = cell.props[type];
        for (let i = 0; i < count; i++) {
          const dx = matrices[i * 16 + 12] - cx, dz = matrices[i * 16 + 14] - cz;
          const src = matrices.subarray(i * 16, i * 16 + 16), color = colors.subarray(i * 3, i * 3 + 3);
          if (dx * dx + dz * dz < near2) { nm.set(src, n * 16); nc.set(color, n * 3); n++; }
          else { fm.set(src, f * 16); fc.set(color, f * 3); f++; }
        }
      }
      for (const [mesh, total] of [[batch.near, n], [batch.far, f]]) {
        mesh.count = total;
        mesh.instanceMatrix.clearUpdateRanges(); mesh.instanceMatrix.addUpdateRange(0, total * 16); mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.clearUpdateRanges(); mesh.instanceColor.addUpdateRange(0, total * 3); mesh.instanceColor.needsUpdate = true;
      }
    }
    this.ready = true; this.version++;
  }

  stats() {
    const counts = Object.fromEntries(PROP_TYPES.map(type => [type, this.props[type].near.count + this.props[type].far.count]));
    let tiles = 0, water = 0;
    for (const tile of this.tiles.values()) if (tile.state === 'ready') { tiles++; if (tile.water) water++; }
    return { tiles, water, cells: this.cells.size, grass: this.grass.count, props: counts, backlog: this.streamer.backlog };
  }

  dispose() {
    for (const tile of [...this.tiles.values()]) this.disposeTile(tile);
    for (const { near, far } of Object.values(this.props)) for (const mesh of [near, far]) { this.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); mesh.dispose(); }
    this.grass.dispose(); this.terrainMaterial.dispose(); this.waterMaterial.dispose();
  }
}
