import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry,
  DodecahedronGeometry, Group, IcosahedronGeometry, InstancedMesh,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D,
  SphereGeometry, TorusGeometry, TubeGeometry, Vector3, BoxGeometry,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boundary, geometryFromTriangles, heightAt, insideIsland, random, TAU } from './math.js';
import { rockMaterial, windMaterial } from './materials.js';

const path = [[-1.92, 1.63], [-1.65, 1.4], [-1.38, 1.17], [-1.13, .92], [-.88, .68], [-.6, .42]];

function mesh(geometry, material, parent, position, scale) {
  const item = new Mesh(geometry, material);
  if (position) item.position.set(...position);
  if (scale) item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function createLand(parent, rng) {
  const segments = 96, rings = 20;
  const positions = [0, heightAt(0, 0), 0], colors = [], indices = [];
  const dark = new Color('#1a3448'), light = new Color('#365c70'), color = new Color();
  colors.push(dark.r, dark.g, dark.b);
  for (let ring = 1; ring <= rings; ring++) {
    for (let i = 0; i < segments; i++) {
      const a = i / segments * TAU;
      const radius = boundary(a) * ring / rings;
      const x = Math.cos(a) * radius, z = Math.sin(a) * radius * .84;
      positions.push(x, heightAt(x, z), z);
      color.copy(dark).lerp(light, .2 + rng() * .55);
      colors.push(color.r, color.g, color.b);
      const current = 1 + (ring - 1) * segments + i;
      const next = 1 + (ring - 1) * segments + (i + 1) % segments;
      if (ring === 1) indices.push(0, next, current);
      else {
        const inner = current - segments, innerNext = next - segments;
        indices.push(inner, next, current, inner, innerNext, next);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(geometry, new MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: .02 }), parent);

  const rockPositions = [], rockColors = [];
  const rockPalette = ['#233046', '#29394e', '#334359', '#39425b', '#27334b', '#3e455e'].map(c => new Color(c));
  const levels = [0, -.33, -.91, -1.58, -2.25, -2.9];
  const widths = [1, 1.025, .89, .69, .41, .06];
  const sides = 48, rockRings = [];
  for (let k = 0; k < levels.length; k++) {
    const row = [];
    for (let i = 0; i < sides; i++) {
      const a = i / sides * TAU;
      const jag = k === 0 ? 1 : 1 + (rng() - .5) * .22;
      const x = Math.cos(a) * boundary(a) * widths[k] * jag + k * .045;
      const z = Math.sin(a) * boundary(a) * .84 * widths[k] * jag;
      const y = k === 0 ? heightAt(x, z) - .015 : levels[k] + (rng() - .5) * .22;
      row.push([x, y, z]);
    }
    rockRings.push(row);
  }
  const face = (a, b, c, shade) => {
    rockPositions.push(...a, ...b, ...c);
    const color = rockPalette[Math.floor(rng() * rockPalette.length)].clone().multiplyScalar(shade);
    for (let j = 0; j < 3; j++) rockColors.push(color.r, color.g, color.b);
  };
  for (let k = 0; k < rockRings.length - 1; k++) {
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const a = rockRings[k][i], b = rockRings[k][next], c = rockRings[k + 1][i], d = rockRings[k + 1][next];
      face(a, b, c, 1.04 - k * .045);
      face(b, d, c, 1 - k * .045);
    }
  }
  const rock = rockMaterial();
  mesh(geometryFromTriangles(rockPositions, rockColors), rock, parent);

  // Basalt outcrops interrupt the silhouette rather than leaving a perfect cone.
  const outcrops = [];
  for (let i = 0; i < 46; i++) {
    const a = rng() * TAU, depth = .4 + rng() * 1.95;
    const r = boundary(a) * (1 - depth * .21);
    const geometry = new DodecahedronGeometry(1, 0);
    const col = new Color(rockPalette[Math.floor(rng() * rockPalette.length)]);
    const array = new Float32Array(geometry.attributes.position.count * 3);
    for (let n = 0; n < array.length; n += 9) {
      const shade = .8 + rng() * .4;
      for (let p = 0; p < 9 && n + p < array.length; p += 3) {
        array[n + p] = col.r * shade; array[n + p + 1] = col.g * shade; array[n + p + 2] = col.b * shade;
      }
    }
    geometry.setAttribute('color', new BufferAttribute(array, 3));
    geometry.scale(.18 + rng() * .29, .25 + rng() * .55, .16 + rng() * .28);
    geometry.rotateY(a);
    geometry.rotateZ((rng() - .5) * .45);
    geometry.translate(Math.cos(a) * r, -depth, Math.sin(a) * r * .84);
    outcrops.push(geometry);
  }
  mesh(mergeGeometries(outcrops), rock, parent);
  outcrops.forEach(g => g.dispose());
  return rock;
}

function createGrass(parent, rng, time, compact) {
  const blade = geometryFromTriangles([
    -.018, 0, 0, .018, 0, 0, .012, .095, .011,
    -.018, 0, 0, .012, .095, .011, -.011, .095, .011,
    -.011, .095, .011, .012, .095, .011, .026, .2, .027,
  ]);
  const material = windMaterial({ time });
  const count = compact ? 9500 : 19000;
  const grass = new InstancedMesh(blade, material, count);
  const dummy = new Object3D(), color = new Color();
  const shades = ['#3d6878', '#427b8b', '#315b70', '#58758f', '#3e5f7e'].map(c => new Color(c));
  let placed = 0;
  for (let attempts = 0; placed < count && attempts < count * 8; attempts++) {
    const x = (rng() - .5) * 6.9, z = (rng() - .5) * 5.9;
    if (!insideIsland(x, z, .075)) continue;
    if (Math.hypot(x + .22, z + .18) < .67) continue;
    if (path.some(([px, pz]) => Math.hypot(x - px, z - pz) < .22)) continue;
    const scale = .48 + rng() * .87;
    dummy.position.set(x, heightAt(x, z) - .017, z);
    dummy.rotation.set((rng() - .5) * .28, rng() * TAU, (rng() - .5) * .32);
    dummy.scale.set(scale, scale * (.6 + rng() * .65), scale);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    color.copy(shades[Math.floor(rng() * shades.length)]).multiplyScalar(.65 + rng() * .7);
    grass.setColorAt(placed++, color);
  }
  grass.count = placed;
  grass.receiveShadow = true;
  grass.instanceMatrix.needsUpdate = true;
  grass.computeBoundingSphere();
  parent.add(grass);
}

function createStones(parent, rng) {
  const stone = new MeshStandardMaterial({ color: '#69728a', roughness: .95, metalness: .08, flatShading: true });
  path.forEach(([x, z], i) => {
    const item = mesh(new CylinderGeometry(.19 + rng() * .04, .23, .07, 6), stone, parent, [x, heightAt(x, z) + .025, z], [1.18, 1, .79]);
    item.rotation.y = i * .8;
    item.rotation.z = (rng() - .5) * .12;
  });
  const pebbles = new InstancedMesh(new IcosahedronGeometry(1, 0), stone, 135);
  const dummy = new Object3D();
  for (let i = 0; i < 135; i++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * (boundary(a) - .15);
    const x = Math.cos(a) * r, z = Math.sin(a) * r * .84;
    dummy.position.set(x, heightAt(x, z) + .015, z);
    const size = .025 + Math.pow(rng(), 3) * .14;
    dummy.scale.set(size, size * .5, size * .8);
    dummy.rotation.set(rng(), rng() * TAU, rng()); dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
  pebbles.castShadow = true; pebbles.receiveShadow = true;
  parent.add(pebbles);

  // Broken milestones with restrained emissive inlays.
  const rune = new MeshStandardMaterial({ color: '#8fb7ca', emissive: '#62bcdf', emissiveIntensity: 2.1, roughness: .45 });
  for (const [x, z, size, tilt] of [[-2.05, -.38, .55, -.18], [1.65, -.9, .34, .22]]) {
    const marker = new Group();
    marker.position.set(x, heightAt(x, z), z); marker.rotation.z = tilt;
    mesh(new CylinderGeometry(.13, .2, size, 5), stone, marker, [0, size / 2, 0]);
    mesh(new BoxGeometry(.018, size * .46, .01), rune, marker, [0, size * .6, .146]);
    mesh(new BoxGeometry(.085, .014, .011), rune, marker, [0, size * .73, .147]);
    parent.add(marker);
  }

  const ring = mesh(new TorusGeometry(.65, .013, 4, 80, Math.PI * 1.67), stone, parent, [-.22, heightAt(-.22, -.18) + .045, -.18]);
  ring.rotation.x = Math.PI / 2;
}

function createBench(parent) {
  const bench = new Group(), wood = new MeshStandardMaterial({ color: '#635572', roughness: .82 });
  const metal = new MeshStandardMaterial({ color: '#252c40', roughness: .55, metalness: .65 });
  for (let i = 0; i < 3; i++) mesh(new BoxGeometry(.7, .032, .065), wood, bench, [0, .25, (i - 1) * .081]);
  for (const x of [-.25, .25]) {
    for (const z of [-.075, .075]) mesh(new BoxGeometry(.035, .24, .035), metal, bench, [x, .12, z]);
    const strut = mesh(new BoxGeometry(.028, .25, .028), metal, bench, [x, .35, -.115]);
    strut.rotation.x = -.12;
  }
  for (let i = 0; i < 2; i++) mesh(new BoxGeometry(.7, .065, .026), wood, bench, [0, .37 + i * .075, -.13]);
  bench.position.set(1.39, heightAt(1.39, .94), .94);
  bench.rotation.y = -.55;
  parent.add(bench);
}

function createMushrooms(parent, rng) {
  const caps = [], stems = [], dots = [];
  const centers = [[-2.1, 1.05], [-1.45, -.92], [2.2, .44], [.9, 1.65], [-.65, 1.8], [2.25, -.65]];
  const capMaterial = new MeshStandardMaterial({ color: '#81c8e4', emissive: '#458ec5', emissiveIntensity: .95, roughness: .6 });
  const stemMaterial = new MeshStandardMaterial({ color: '#b2b3d1', emissive: '#416eac', emissiveIntensity: .3, roughness: .8 });
  const lightMaterial = new MeshBasicMaterial({ color: '#a4e5ff', toneMapped: false });
  for (const [cx, cz] of centers) {
    const count = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < count; i++) {
      const x = cx + (rng() - .5) * .4, z = cz + (rng() - .5) * .35;
      const y = heightAt(x, z), size = .045 + rng() * .065, h = size * (1.4 + rng());
      const cap = new SphereGeometry(size, 10, 6, 0, TAU, 0, Math.PI * .58);
      cap.scale(1.25, .52, 1.25); cap.translate(x, y + h, z); caps.push(cap);
      const stem = new CylinderGeometry(size * .14, size * .25, h, 5); stem.translate(x, y + h / 2, z); stems.push(stem);
      const dot = new SphereGeometry(size * .13, 5, 4); dot.translate(x, y + h + size * .51, z); dots.push(dot);
    }
  }
  for (const [parts, material] of [[caps, capMaterial], [stems, stemMaterial], [dots, lightMaterial]]) {
    mesh(mergeGeometries(parts), material, parent); parts.forEach(g => g.dispose());
  }
}

function createCrystals(parent, rng) {
  const dark = new MeshStandardMaterial({ color: '#4c4f8b', emissive: '#42438c', emissiveIntensity: .38, roughness: .33, metalness: .4, flatShading: true });
  const bright = new MeshStandardMaterial({ color: '#b5b0fa', emissive: '#8f6aec', emissiveIntensity: 1.65, roughness: .25, metalness: .25, flatShading: true });
  const groups = [[-1.5, -.84, 1.5], [1.5, -1.14, 1.38], [.32, -2.54, .2]];
  for (const [x, y, z] of groups) {
    const group = new Group(); group.position.set(x, y, z); group.rotation.z = x * .23;
    for (let i = 0; i < 5; i++) {
      const h = .22 + rng() * .47;
      const crystal = mesh(new CylinderGeometry(0, .065 + rng() * .05, h, 5), i % 3 ? dark : bright, group, [(rng() - .5) * .34, (rng() - .5) * .15, (rng() - .5) * .25]);
      crystal.rotation.set((rng() - .5) * .9, rng(), Math.PI + (rng() - .5) * .9);
    }
    parent.add(group);
  }

  // Hairline mineral seams emerge only from a few fractured faces.
  const seamMaterial = new MeshBasicMaterial({ color: '#6355bd', toneMapped: false });
  const seams = [];
  for (let i = 0; i < 9; i++) {
    const a = .3 + rng() * Math.PI, y = -.45 - rng() * 1.1;
    const r = boundary(a) * (1 + y * .18);
    const x = Math.cos(a) * r, z = Math.sin(a) * r * .84;
    const points = [new Vector3(x, y, z), new Vector3(x * .95 + .035, y - .13, z * .98), new Vector3(x * .92 - .04, y - .26, z * .96)];
    seams.push(new TubeGeometry(new CatmullRomCurve3(points), 5, .006, 3, false));
  }
  mesh(mergeGeometries(seams), seamMaterial, parent); seams.forEach(g => g.dispose());
}

function createFragments(parent, rock, rng) {
  const fragments = [];
  for (let i = 0; i < 14; i++) {
    const a = rng() * TAU, r = 3.7 + rng() * 1.3;
    const geometry = new DodecahedronGeometry(1, 0);
    const color = new Color(i % 2 ? '#29364f' : '#3c3c5e');
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let n = 0; n < colors.length; n += 3) { colors[n] = color.r; colors[n + 1] = color.g; colors[n + 2] = color.b; }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    const item = mesh(geometry, rock, parent, [Math.cos(a) * r, -.7 - rng() * 2.3, Math.sin(a) * r * .8]);
    const size = .055 + rng() * .18;
    item.scale.set(size * 1.2, size * (1.2 + rng()), size);
    item.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    fragments.push({ mesh: item, y: item.position.y, rotation: item.rotation.y, phase: rng() * TAU, speed: .2 + rng() * .3 });
  }
  return fragments;
}

export function createIsland({ time, compact }) {
  const group = new Group();
  const rng = random(7221);
  const rock = createLand(group, rng);
  createGrass(group, rng, time, compact);
  createStones(group, rng);
  createBench(group);
  createMushrooms(group, rng);
  createCrystals(group, rng);
  const fragments = createFragments(group, rock, rng);
  return {
    group,
    update(t) {
      for (const f of fragments) {
        f.mesh.position.y = f.y + Math.sin(t * f.speed + f.phase) * .09;
        f.mesh.rotation.y = f.rotation + t * f.speed * .08;
      }
    },
  };
}
