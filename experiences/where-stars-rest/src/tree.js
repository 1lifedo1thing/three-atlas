import {
  BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, Group, InstancedMesh,
  Mesh, MeshStandardMaterial, Object3D, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { heightAt, random, TAU, taperedTube } from './math.js';
import { windMaterial } from './materials.js';

function curve(points) {
  return new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, 'centripetal');
}

function leafGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([
    0, 0, 0, -.28, .37, .025, -.3, .62, .05, 0, 1, .11,
    .3, .62, .05, .28, .37, .025, 0, .5, .085,
  ]), 3));
  geometry.setIndex([0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0, 6]);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTree({ time, compact, breath = { value: .5 } }) {
  const group = new Group(), rng = random(2017), branches = [], roots = [], curves = [];
  group.position.set(-.22, heightAt(-.22, -.18), -.18);

  const trunk = curve([[0, -.04, 0], [.14, .4, .02], [.03, .88, .04], [-.23, 1.35, -.015], [-.18, 1.86, .03], [.1, 2.38, .02], [.16, 2.9, -.08], [-.05, 3.65, -.02]]);
  branches.push(taperedTube(trunk, .255, 40, 11, 1.15));
  curves.push({ curve: trunk, radius: .255, length: 1.15 });
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + rng() * .2, r = .7 + rng() * .46;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const rootCurve = curve([[.03, .18, 0], [Math.cos(a) * .2, .08, Math.sin(a) * .2], [x * .7, .018, z * .7], [x, heightAt(x - .22, z - .18) - group.position.y + .005, z]]);
    roots.push(taperedTube(rootCurve, .095 + rng() * .035, 15, 7, 1.4));
  }

  const clusters = [];
  const branchLayout = [
    [-2.3, 1.95, 1.14, 3.0, .73, .48], [-1.28, 2.05, 1.69, 2.94, .81, .53],
    [-.12, 1.75, 1.8, 3.0, .84, .51], [.73, 1.86, 1.62, 3.22, .81, .54],
    [1.68, 1.8, 1.53, 3.05, .78, .48], [2.65, 2.1, 1.43, 3.19, .85, .53],
    [3.55, 2.25, 1.43, 3.52, .87, .59], [4.5, 2.3, 1.16, 3.68, .84, .59],
    [5.48, 2.48, .82, 3.85, .79, .57], [1.16, 2.53, .66, 3.91, .82, .55],
    [3.01, 2.72, .69, 4.0, .71, .54],
  ];
  for (let i = 0; i < branchLayout.length; i++) {
    const [a, startHeight, reach, endHeight, width, depth] = branchLayout[i];
    const start = trunk.getPoint(Math.min(.8, startHeight / 4.2));
    const endpoint = new Vector3(Math.cos(a) * reach, endHeight, Math.sin(a) * reach * .83);
    const elbow = new Vector3(endpoint.x * .49 - .08, endHeight - .6, endpoint.z * .45);
    const branch = new CatmullRomCurve3([start, new Vector3(start.x + Math.cos(a) * .28, start.y + .15, start.z + Math.sin(a) * .18), elbow, endpoint]);
    const radius = .1 + (i < 6 ? .025 : -.02);
    branches.push(taperedTube(branch, radius, 21, 7, 1.5));
    curves.push({ curve: branch, radius, length: 1.5 });
    clusters.push({ center: endpoint, size: new Vector3(width, depth, width * .79), phase: rng() });

    // Each secondary branch really connects to its own spray of leaves.
    for (let j = 0; j < 3; j++) {
      const t = .4 + j * .17;
      const root = branch.getPoint(t);
      const angle = a + (j % 2 ? -.83 : .78);
      const end = root.clone().add(new Vector3(Math.cos(angle) * .53, .31 + rng() * .25, Math.sin(angle) * .48));
      const twig = new CatmullRomCurve3([root, root.clone().lerp(end, .52).add(new Vector3(0, .09, 0)), end]);
      branches.push(taperedTube(twig, .035 - j * .004, 10, 5, 1.3));
      clusters.push({ center: end, size: new Vector3(.41 + rng() * .13, .27, .37), phase: rng() });
    }
  }
  clusters.push({ center: new Vector3(-.05, 4.02, -.02), size: new Vector3(.77, .55, .68), phase: .8 });

  const bark = new MeshStandardMaterial({ vertexColors: true, roughness: .83, metalness: .17 });
  const wood = new Mesh(mergeGeometries([...branches, ...roots]), bark);
  wood.castShadow = true; wood.receiveShadow = true; group.add(wood);
  [...branches, ...roots].forEach(g => g.dispose());

  // A few sap veins follow the curvature of the bark, with substantial dark gaps.
  const veins = [];
  for (let i = 0; i < 3; i++) {
    const points = [];
    for (let j = 0; j <= 42; j++) {
      const t = .025 + j / 42 * .86, p = trunk.getPointAt(t);
      const r = .255 * (.035 + .965 * Math.pow(1 - t, 1.15)) + .003;
      const angle = i / 3 * TAU + t * 5.5;
      p.x += Math.cos(angle) * r; p.z += Math.sin(angle) * r;
      points.push(p);
    }
    veins.push(new TubeGeometry(new CatmullRomCurve3(points), 45, .0065, 4, false));
  }
  for (let i = 0; i < 7; i++) {
    const b = curves[1 + i], points = [];
    for (let j = 0; j <= 15; j++) {
      const t = .1 + j / 15 * .72, p = b.curve.getPointAt(t);
      p.z += b.radius * Math.pow(1 - t, b.length) * .92;
      points.push(p);
    }
    veins.push(new TubeGeometry(new CatmullRomCurve3(points), 16, .0035, 3, false));
  }
  const veinMaterial = new MeshStandardMaterial({ color: '#7197be', emissive: '#4f8ebc', emissiveIntensity: 1.0, roughness: .5 });
  const sap = new Mesh(mergeGeometries(veins), veinMaterial); group.add(sap); veins.forEach(g => g.dispose());

  const material = windMaterial({ time, breath, leaf: true, emissive: '#b57cff', intensity: 2.2 });
  const count = compact ? 8200 : 13500;
  const leaves = new InstancedMesh(leafGeometry(), material, count);
  const dummy = new Object3D(), color = new Color();
  const violet = new Color('#7b45bb'), purple = new Color('#a35ac7'), pink = new Color('#dc88ca'), pale = new Color('#edb1da'), blue = new Color('#647cd1');
  const weights = clusters.map(c => c.size.x * c.size.y * c.size.z);
  const total = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < count; i++) {
    let choose = rng() * total, index = 0;
    while (choose > weights[index] && index < clusters.length - 1) choose -= weights[index++];
    const cluster = clusters[index];
    const a = rng() * TAU, b = Math.acos(rng() * 2 - 1), radius = Math.pow(rng(), .35);
    const x = cluster.center.x + Math.sin(b) * Math.cos(a) * cluster.size.x * radius;
    const y = cluster.center.y + Math.cos(b) * cluster.size.y * radius;
    const z = cluster.center.z + Math.sin(b) * Math.sin(a) * cluster.size.z * radius;
    dummy.position.set(x, y, z);
    dummy.rotation.set((rng() - .5) * Math.PI * 1.6, rng() * TAU, (rng() - .5) * Math.PI * 1.5);
    const size = .11 + rng() * .13;
    dummy.scale.set(size * (.75 + rng() * .4), size, size);
    dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);

    const gradient = Math.min(1, Math.max(0, (y - 2.5) / 2));
    if (gradient < .42) color.copy(blue).lerp(violet, gradient / .42);
    else if (gradient < .72) color.copy(purple).lerp(pink, (gradient - .42) / .3);
    else color.copy(pink).lerp(pale, (gradient - .72) / .28);
    color.lerp(violet, rng() * .2).multiplyScalar(.62 + rng() * .61);
    leaves.setColorAt(i, color);
  }
  leaves.instanceMatrix.needsUpdate = true;
  leaves.castShadow = true; leaves.receiveShadow = true;
  leaves.computeBoundingSphere(); group.add(leaves);

  return {
    group,
    update(t, pulse = 0, glow = .55) {
      group.rotation.z = Math.sin(t * .43) * .006;
      if (material.userData.shader) material.userData.shader.uniforms.uBloomPulse.value = pulse;
      material.emissiveIntensity = glow * 4;
      veinMaterial.emissiveIntensity = glow * (.65 + breath.value * .75 + pulse * .55);
    },
  };
}
