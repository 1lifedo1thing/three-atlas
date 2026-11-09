// Brass clockwork adrift: four extruded gear shapes as instanced meshes, lensed in the vertex shader
// and dissolved by "proton decay" in the fragment shader. Lit by the disk (a point light) and a PMREM environment.
import {
  BackSide, Color, DynamicDrawUsage, Euler, ExtrudeGeometry, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Path, PMREMGenerator, PointLight, Quaternion, Scene, Shape, ShaderMaterial, SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import { LENS, NOISE } from './shaders.js';
import { OMK, TAU, clamp, lerp, smooth } from './physics.js';

function gearGeometry(teeth, rRoot, rTip, holeR, spokes, depth) {
  const shape = new Shape(), step = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    [[a0, rRoot], [a0 + step * 0.16, rTip], [a0 + step * 0.46, rTip], [a0 + step * 0.62, rRoot]].forEach(([a, r], k) => {
      if (i === 0 && k === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    });
  }
  shape.closePath();
  const hole = new Path(); hole.absarc(0, 0, holeR, 0, TAU, true); shape.holes.push(hole);
  if (spokes) {
    const rin = holeR * 2.1, rout = rRoot * 0.8, sw = 0.09 * rRoot;
    for (let s = 0; s < spokes; s++) {
      const a0 = (s * TAU) / spokes, a1 = a0 + TAU / spokes, p = new Path();
      p.absarc(0, 0, rout, a0 + sw / rout, a1 - sw / rout, false);
      p.absarc(0, 0, rin, a1 - sw / rin, a0 + sw / rin, true);
      p.closePath(); shape.holes.push(p);
    }
  }
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.22, bevelSize: 0.02, bevelSegments: 2, curveSegments: 20 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** A tiny studio for the brass to reflect: a dark sky band and a hot ring standing in for the disk. */
function environment(renderer, rand, randn) {
  const pm = new PMREMGenerator(renderer), es = new Scene();
  es.add(new Mesh(new SphereGeometry(80, 32, 16), new ShaderMaterial({
    side: BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ vec3 d = normalize(vP); float b = exp(-pow(dot(d, normalize(vec3(.32,.86,-.4))), 2.0) * 9.0); gl_FragColor = vec4(vec3(0.012, 0.016, 0.03) + vec3(0.05, 0.05, 0.09) * b, 1.0); }',
  })));
  for (const [r, t, c, z] of [[8, 3.2, [1.6, 0.75, 0.25], 0.25], [4, 1, [3, 2.3, 1.6], 0.3]]) {
    const ring = new Mesh(new TorusGeometry(r, t, 16, 96), new MeshBasicMaterial({ color: new Color().setRGB(...c) }));
    ring.rotation.x = Math.PI / 2; ring.scale.z = z; es.add(ring);
  }
  for (let i = 0; i < 40; i++) {
    const s = new Mesh(new SphereGeometry(0.6 + rand(), 8, 6), new MeshBasicMaterial({ color: new Color().setRGB(2, 2.2, 2.6) }));
    s.position.set(randn(), randn(), randn()).normalize().multiplyScalar(60); es.add(s);
  }
  const target = pm.fromScene(es, 0.03);
  pm.dispose();
  es.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  return target;
}

function patch(material, U, decay) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uCamPos = U.camPos; shader.uniforms.uLens = U.lens; shader.uniforms.uDecay = decay;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${LENS}\nvarying vec3 vObjP;`)
      .replace('#include <project_vertex>', `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        vec4 wPos = modelMatrix * mvPosition;
        vObjP = transformed + vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]) * 0.37;
        wPos.xyz = lensWorld(wPos.xyz);
        mvPosition = viewMatrix * wPos;
        gl_Position = projectionMatrix * mvPosition;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE}\nuniform float uDecay;\nvarying vec3 vObjP;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (uDecay > 0.001) {
          float nn = snoise(vObjP * 2.2) * 0.5 + 0.5;
          float th = uDecay * 1.12 - 0.06;
          if (nn < th) discard;
          totalEmissiveRadiance += vec3(1.0, 0.42, 0.12) * (1.0 - smoothstep(0.0, 0.07, nn - th)) * 7.0;
        }`);
  };
}

export function createGears({ renderer, scene, U, dialRotation, small, rand, randn }) {
  const env = environment(renderer, rand, randn);
  const decay = { value: 0 };
  const types = [
    { g: gearGeometry(12, 0.82, 1.0, 0.2, 0, 0.22), n: small ? 20 : 34, s: [0.25, 0.6] },
    { g: gearGeometry(26, 0.9, 1.0, 0.12, 5, 0.12), n: small ? 14 : 22, s: [0.55, 1.15] },
    { g: gearGeometry(48, 0.94, 1.0, 0.07, 6, 0.07), n: small ? 5 : 8, s: [1.0, 1.8] },
    { g: gearGeometry(15, 0.78, 1.0, 0.14, 3, 0.16), n: small ? 8 : 12, s: [0.4, 0.9] },
  ];
  const brass = [0xc9a062, 0xa77f45, 0x8c6a3c, 0xb7b2a8, 0xd6b47a].map(c => new Color(c));
  const dialQ = new Quaternion().setFromEuler(dialRotation);
  const flat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  const meshes = [], data = [];
  types.forEach((T, ti) => {
    const material = new MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.42, envMap: env.texture, envMapIntensity: 0.7 });
    patch(material, U, decay);
    const mesh = new InstancedMesh(T.g, material, T.n);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    for (let i = 0; i < T.n; i++) {
      const onDial = rand() < 0.28; // a quarter of the gears lie flat in the dial plane
      const R = onDial ? lerp(14, 22, rand()) : lerp(10, 26, Math.pow(rand(), 0.8));
      const d = {
        mesh, i, R, onDial, incl: onDial ? 0 : randn() * 0.2, node: rand() * TAU, ph: rand() * TAU,
        y: onDial ? randn() * 0.5 : randn() * 0.9, om: OMK * Math.pow(R, -1.5) * (0.55 + rand() * 0.3),
        spin: (0.15 + rand() * 0.5) * (rand() < 0.5 ? -1 : 1),
        q0: new Quaternion().setFromEuler(new Euler(rand() * TAU, rand() * TAU, rand() * TAU)),
        tumble: new Vector3(randn(), randn(), randn()).normalize(), tumbleRate: (rand() - 0.5) * 0.12,
        scale: lerp(T.s[0], T.s[1], Math.pow(rand(), 1.6)),
      };
      if (onDial) { d.q0.copy(dialQ).multiply(flat); d.tumbleRate = 0; }
      mesh.setColorAt(i, brass[(ti + i) % brass.length]);
      data.push(d);
    }
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    meshes.push(mesh);
  });
  const light = new PointLight(0xffb56a, 48, 0, 1.55);
  const hemi = new HemisphereLight(0x4a5c86, 0x0a0806, 0.35);
  scene.add(light, hemi);

  const m4 = new Matrix4(), q = new Quaternion(), q2 = new Quaternion(), v = new Vector3(), s = new Vector3(), zAxis = new Vector3(0, 0, 1), e = new Euler();
  return {
    decay, light, hemi,
    update(camera, simT, spinT, appear) {
      const cp = camera.position, Dl = cp.length();
      for (const d of data) {
        const a = d.ph + d.om * simT;
        if (d.onDial) v.set(Math.sin(a) * d.R, d.y, -Math.cos(a) * d.R).applyQuaternion(dialQ);
        else { v.set(Math.cos(a) * d.R, d.y, Math.sin(a) * d.R); e.set(d.incl, d.node, 0); v.applyEuler(e); }
        q.copy(d.q0);
        if (d.tumbleRate) q.premultiply(q2.setFromAxisAngle(d.tumble, d.tumbleRate * simT));
        q.multiply(q2.setFromAxisAngle(zAxis, d.spin * spinT));
        const dc = v.distanceTo(cp);
        // A solid gear whose image would be smeared into an Einstein arc is swallowed instead.
        const cb = -((v.x - cp.x) * cp.x + (v.y - cp.y) * cp.y + (v.z - cp.z) * cp.z) / (dc * Dl), Ds = dc * cb;
        let hide = 1;
        if (Ds > Dl) {
          const thE = Math.sqrt((2 * (Ds - Dl)) / (Dl * Ds)), beta = Math.acos(clamp(cb, -1, 1)), ang = (d.scale * 1.2) / dc;
          hide = smooth(thE * 1.1 + ang, thE * 2.6 + ang * 2, beta);
        }
        s.setScalar(Math.max(d.scale * smooth(4, 15, dc) * appear * hide, 1e-4));
        d.mesh.setMatrixAt(d.i, m4.compose(v, q, s));
      }
      for (const m of meshes) m.instanceMatrix.needsUpdate = true;
    },
    dispose() { env.dispose(); for (const m of meshes) { m.geometry.dispose(); m.material.dispose(); m.dispose(); } },
  };
}
