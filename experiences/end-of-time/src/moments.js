// Moments you throw in: a glowing core with a trail, a label that follows its lensed image,
// and the slowing, reddening fall that freezes on the horizon as seen from outside.
import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Points, Raycaster, ShaderMaterial, Vector2, Vector3 } from 'three';
import { LENS } from './shaders.js';
import { OMK, clamp, fallStep, lensAngle, lerp, smooth } from './physics.js';

const MAX = 36, TRAIL = 40;

export function createMoments(U, labelsEl) {
  const n = MAX * (TRAIL + 1);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute('aCol', new BufferAttribute(new Float32Array(n * 4), 4).setUsage(DynamicDrawUsage));
  geometry.setAttribute('aSize', new BufferAttribute(new Float32Array(n), 1).setUsage(DynamicDrawUsage));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uCamPos: U.camPos, uLens: U.lens, uPx: U.px },
    vertexShader: `${LENS} attribute vec4 aCol; attribute float aSize; uniform float uPx; varying vec4 vC;
      void main(){ vec4 mv = viewMatrix * vec4(lensWorld(position), 1.0); gl_Position = projectionMatrix * mv; vC = aCol;
        gl_PointSize = aCol.a < 0.001 ? 0.0 : clamp(aSize * uPx / max(-mv.z, 0.05), 1.5, 64.0); }`,
    fragmentShader: `varying vec4 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c) * 4.0; if (d > 1.0) discard;
      float a = (exp(-d * 6.0) + exp(-d * 1.6) * 0.25) * vC.a; gl_FragColor = vec4(vC.rgb, a); }`,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  const list = [], raycaster = new Raycaster(), ndc = new Vector2(), tmp = new Vector3(), lh = new Vector3(), perp = new Vector3();

  /** Same lens as the shader, on the CPU, so a DOM label can sit on the image rather than the object. */
  function lensed(P, camera, out) {
    const C = camera.position, Dl = C.length();
    lh.copy(C).multiplyScalar(-1 / Dl);
    const V = out.copy(P).sub(C), Dp = V.length();
    if (Dp < 1e-4) return out.copy(P);
    V.divideScalar(Dp);
    const cb = V.dot(lh), Ds = Dp * cb;
    if (Ds <= Dl || U.lens.value <= 0) return out.copy(P);
    const beta = Math.acos(clamp(cb, -1, 1));
    const theta = beta + (lensAngle(beta, Dl, Ds) - beta) * U.lens.value;
    perp.copy(V).addScaledVector(lh, -cb);
    const pl = perp.length();
    if (pl < 1e-6) return out.copy(P);
    perp.divideScalar(pl);
    return out.copy(lh).multiplyScalar(Math.cos(theta)).addScaledVector(perp, Math.sin(theta)).multiplyScalar(Dp).add(C);
  }

  return {
    points, list,
    spawn(camera, x, y, phrase, stamp) {
      ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const P = camera.position.clone().addScaledVector(raycaster.ray.direction, clamp(camera.position.length() * 0.5, 3, 26));
      if (P.length() < 5) P.setLength(5);
      if (list.length >= MAX) list.shift().label.remove();
      const u = P.clone().normalize();
      const tang = new Vector3(0, 1, 0).cross(u);
      if (tang.lengthSq() < 1e-3) tang.set(1, 0, 0);
      tang.normalize();
      const v = new Vector3().crossVectors(new Vector3().crossVectors(u, tang).normalize(), u).normalize();
      const label = document.createElement('div');
      label.className = 'eot-moment';
      label.append(phrase, Object.assign(document.createElement('small'), { textContent: stamp }));
      labelsEl.append(label);
      const r0 = P.length();
      list.push({ u, v, r: r0, phi: 0, L: OMK * Math.sqrt(r0) * (0.7 + Math.random() * 0.5), age: 0, frozenAge: 0, trail: Array.from({ length: TRAIL }, () => P.clone()), trailAcc: 0, label, pos: P.clone() });
    },
    update(camera, sdt, dt, frozenText) {
      const pos = geometry.attributes.position.array, col = geometry.attributes.aCol.array, size = geometry.attributes.aSize.array;
      col.fill(0);
      for (let k = list.length - 1; k >= 0; k--) {
        const m = list[k];
        Object.assign(m, fallStep(m, sdt));
        m.age += sdt;
        const fz = 1 - 1 / m.r;
        if (fz < 0.12) m.frozenAge += dt;
        if (m.frozenAge > 70) { m.label.remove(); list.splice(k, 1); continue; }
        m.pos.copy(m.u).multiplyScalar(Math.cos(m.phi) * m.r).addScaledVector(m.v, Math.sin(m.phi) * m.r);
        m.trailAcc += sdt;
        if (m.trailAcc > 0.035) { m.trailAcc = 0; m.trail.pop(); m.trail.unshift(m.pos.clone()); }
        const bright = fz * fz * 5 + (fz < 0.3 ? 0.22 * Math.exp(-m.frozenAge / 22) : 0);
        // gold → orange → deep red as the light is stretched climbing out of the well
        const red = 1 - smooth(0.05, 0.75, fz), cg = lerp(0.82, 0.12, red), cb = lerp(0.55, 0.04, red);
        const base = k * (TRAIL + 1), stretch = 1 + 3 / (m.r * m.r);
        pos.set([m.pos.x, m.pos.y, m.pos.z], base * 3);
        col.set([bright, cg * bright, cb * bright, 1], base * 4);
        size[base] = 0.22 * stretch;
        for (let i = 0; i < TRAIL; i++) {
          const j = base + 1 + i, p = m.trail[i], fade = Math.pow(1 - i / TRAIL, 1.6), b = bright * fade * 0.45;
          pos.set([p.x, p.y, p.z], j * 3);
          col.set([b, cg * b * 0.9, cb * b * 0.8, m.r < 1.08 ? 0 : 1], j * 4);
          size[j] = 0.12 * fade * stretch;
        }
        lensed(m.pos, camera, tmp).project(camera);
        const visible = tmp.z < 1 && Math.abs(tmp.x) < 1.2 && Math.abs(tmp.y) < 1.2 && k >= list.length - 4;
        const op = visible ? clamp(Math.min(m.age / 0.5, 1) * (fz > 0.3 ? 1 : 0.8 * Math.exp(-m.frozenAge / 3.5)), 0, 1) * U.lens.value : 0;
        m.label.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * innerWidth + 26).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * innerHeight - 8).toFixed(1)}px)`;
        m.label.style.opacity = op.toFixed(3);
        if (fz < 0.3 && !m.label.classList.contains('is-frozen')) {
          m.label.classList.add('is-frozen');
          m.label.querySelector('small').textContent = frozenText;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aCol.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
    },
    clear() { for (const m of list) m.label.remove(); list.length = 0; },
  };
}
