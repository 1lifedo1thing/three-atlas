// The cosmic clock: dial rings and ticks, Roman numerals, an inscription band and three hands.
// Everything lies in the dial's local XZ plane; angle a runs clockwise from XII seen from the face (+y).
import { AdditiveBlending, BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, Group, Mesh, NoColorSpace, RepeatWrapping, ShaderMaterial, Vector3 } from 'three';
import { LENS, LINE_VERT, LINE_FRAG } from './shaders.js';
import { TAU, lerp } from './physics.js';

const GOLD = [1.0, 0.78, 0.46];
const PALE = [0.92, 0.88, 0.8];
const RED = [1.0, 0.36, 0.22];
const col4 = (c, k) => [c[0], c[1], c[2], k];
const dirA = (a, r, y = 0) => new Vector3(Math.sin(a) * r, y, -Math.cos(a) * r);
const angOrder = a => (((a % TAU) + TAU) % TAU) / TAU;
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const FONT = '"Geist Variable", "PingFang SC", "Noto Sans SC", system-ui, sans-serif';

/** Collects line segments as quads: both ends of each segment know the other end, so the shader can extrude in screen space. */
class Lines {
  constructor() { this.P = []; this.O = []; this.S = []; this.N = []; this.W = []; this.C = []; this.A = []; this.R = []; this.I = []; this.v = 0; }
  seg(a, b, wa, wb, ca, cb, ga, gb, oa, ob) {
    const push = (p, o, side, end, w, c, g, ord) => {
      this.P.push(p.x, p.y, p.z); this.O.push(o.x, o.y, o.z); this.S.push(side); this.N.push(end);
      this.W.push(w); this.C.push(...c); this.A.push(g); this.R.push(ord);
    };
    push(a, b, -1, 1, wa, ca, ga, oa); push(a, b, 1, 1, wa, ca, ga, oa);
    push(b, a, 1, -1, wb, cb, gb, ob); push(b, a, -1, -1, wb, cb, gb, ob);
    const i = this.v; this.I.push(i, i + 1, i + 2, i, i + 2, i + 3); this.v += 4;
  }
  poly(pts, wf, cf, gf, of) {
    for (let i = 0; i < pts.length - 1; i++) {
      const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
      this.seg(pts[i], pts[i + 1], wf(t0), wf(t1), cf(t0), cf(t1), gf(t0, pts[i]), gf(t1, pts[i + 1]), of(t0, pts[i]), of(t1, pts[i + 1]));
    }
  }
  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.P, 3));
    g.setAttribute('aOther', new Float32BufferAttribute(this.O, 3));
    g.setAttribute('aSide', new Float32BufferAttribute(this.S, 1));
    g.setAttribute('aEnd', new Float32BufferAttribute(this.N, 1));
    g.setAttribute('aWidth', new Float32BufferAttribute(this.W, 1));
    g.setAttribute('aCol', new Float32BufferAttribute(this.C, 4));
    g.setAttribute('aAng', new Float32BufferAttribute(this.A, 1));
    g.setAttribute('aOrder', new Float32BufferAttribute(this.R, 1));
    g.setIndex(this.I);
    return g;
  }
}

function lineMaterial(U, extra = {}) {
  return new ShaderMaterial({
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthWrite: false, depthTest: true,
    side: DoubleSide, blending: AdditiveBlending,
    uniforms: {
      uCamPos: U.camPos, uLens: U.lens, uRes: U.res, uPx: U.px,
      uRot: { value: 0 }, uHand: { value: 0 }, uReveal: { value: 1 }, uDim: { value: 1 }, uSweepK: { value: 1 }, ...extra,
    },
  });
}
const mesh = (geometry, material) => { const m = new Mesh(geometry, material); m.frustumCulled = false; return m; };

function dialLines(U) {
  const L = new Lines();
  const ring = (r, w, k, c = GOLD, segs = 720, dash = 0) => {
    for (let i = 0; i < segs; i++) {
      if (dash && i % dash >= dash / 2) continue;
      const a0 = (i / segs) * TAU, a1 = ((i + 1) / segs) * TAU;
      L.seg(dirA(a0, r), dirA(a1, r), w, w, col4(c, k), col4(c, k), a0, a1, angOrder(a0) * 0.9, angOrder(a1) * 0.9);
    }
  };
  const tick = (a, r0, r1, w, k, c = GOLD) => L.seg(dirA(a, r0), dirA(a, r1), w, w * 0.6, col4(c, k), col4(c, k * 0.7), a, a, angOrder(a) * 0.9, angOrder(a) * 0.9);
  ring(18.55, 0.025, 1.0); ring(20.05, 0.06, 1.6); ring(20.35, 0.018, 0.8);
  ring(23.85, 0.02, 0.7, PALE); ring(26.0, 0.02, 0.45, PALE, 720, 6); ring(4.3, 0.03, 0.9, GOLD, 360);
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * TAU;
    if (m % 5 === 0) { tick(a, 18.75, 19.95, 0.11, 2.2); tick(a + 0.006, 18.75, 19.95, 0.02, 0.6, PALE); }
    else tick(a, 19.25, 19.95, 0.035, 1.2);
  }
  for (let d = 0; d < 360; d++) {
    const a = (d / 360) * TAU, len = d % 10 === 0 ? 0.55 : d % 5 === 0 ? 0.35 : 0.18;
    tick(a, 23.85 - len, 23.85, d % 10 === 0 ? 0.03 : 0.016, d % 10 === 0 ? 0.9 : 0.5, PALE);
  }
  for (let h = 0; h < 24; h++) { // 24 small diamonds: the hours of a day
    const a = ((h + 0.5) / 24) * TAU, r = 22.0, s = 0.32;
    L.poly([dirA(a, r - s), dirA(a + s / r, r), dirA(a, r + s), dirA(a - s / r, r), dirA(a, r - s)], () => 0.02, () => col4(GOLD, 0.9), () => a, () => angOrder(a) * 0.9);
  }
  const material = lineMaterial(U);
  return { mesh: mesh(L.geometry(), material), material };
}

function numerals(U) {
  const cell = 256, cv = document.createElement('canvas');
  cv.width = cell * 4; cv.height = cell * 3;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  ROMAN.forEach((t, i) => {
    let fs = 170;
    cx.font = `250 ${fs}px ${FONT}`;
    const w = cx.measureText(t).width;
    if (w > cell * 0.9) { fs *= (cell * 0.9) / w; cx.font = `250 ${fs}px ${FONT}`; }
    cx.fillText(t, ((i % 4) + 0.5) * cell, (Math.floor(i / 4) + 0.54) * cell);
  });
  const tex = new CanvasTexture(cv);
  tex.anisotropy = 8; tex.colorSpace = NoColorSpace;
  const P = [], UV = [], A = [], I = [], N = 10, size = 2.15, R = 17.1;
  ROMAN.forEach((_, k) => {
    const a = (k / 12) * TAU, up = dirA(a, 1), right = new Vector3(Math.cos(a), 0, Math.sin(a)), c = dirA(a, R);
    const u0 = (k % 4) / 4, v0 = 1 - (Math.floor(k / 4) + 1) / 3, base = P.length / 3;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const p = c.clone().addScaledVector(right, (i / N - 0.5) * size).addScaledVector(up, (j / N - 0.5) * size);
      P.push(p.x, p.y, p.z); UV.push(u0 + i / N / 4, v0 + j / N / 3); A.push(a);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const q = base + j * (N + 1) + i; I.push(q, q + 1, q + N + 2, q, q + N + 2, q + N + 1); }
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new Float32BufferAttribute(UV, 2));
  g.setAttribute('aAng', new Float32BufferAttribute(A, 1));
  g.setIndex(I);
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uCamPos: U.camPos, uLens: U.lens, tMap: { value: tex }, uHand: { value: 0 }, uReveal: { value: 1 }, uDim: { value: 1 } },
    vertexShader: `${LENS}
      attribute float aAng; uniform float uHand, uReveal, uDim; varying vec2 vUv; varying float vK;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); w.xyz = lensWorld(w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
        float d = mod(uHand - aAng + 12.566370, 6.283185);
        float near = smoothstep(16.0, 34.0, gl_Position.w);
        vK = near * (1.0 + exp(-d * 1.4) * 1.6) * smoothstep(aAng / 6.283185 * 0.9, aAng / 6.283185 * 0.9 + 0.05, uReveal) * uDim; }`,
    fragmentShader: `uniform sampler2D tMap; varying vec2 vUv; varying float vK;
      void main(){ float a = texture2D(tMap, vUv).a; if (a < 0.01) discard; gl_FragColor = vec4(vec3(1.0, 0.8, 0.5) * 1.5 * vK, a); }`,
  });
  return { mesh: mesh(g, material), material, texture: tex };
}

function inscription(U, text) {
  const W = 4096, H = 128, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  cx.font = `300 60px ${FONT}`;
  const tw = cx.measureText(text).width;
  cx.setTransform(W / tw, 0, 0, 1, 0, 0);
  cx.fillStyle = '#fff'; cx.textBaseline = 'middle'; cx.font = `300 60px ${FONT}`;
  cx.fillText(text, 0, H * 0.54);
  const tex = new CanvasTexture(cv);
  tex.wrapS = RepeatWrapping; tex.anisotropy = 8; tex.colorSpace = NoColorSpace;
  const P = [], UV = [], I = [], segs = 1024, R = 24.95, Wd = 0.9;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * TAU, pi = dirA(a, R - Wd / 2), po = dirA(a, R + Wd / 2);
    P.push(pi.x, pi.y, pi.z, po.x, po.y, po.z);
    UV.push((i / segs) * 3, 0, (i / segs) * 3, 1);
    if (i < segs) { const q = i * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uCamPos: U.camPos, uLens: U.lens, tMap: { value: tex }, uReveal: { value: 1 }, uDim: { value: 1 } },
    vertexShader: `${LENS} varying vec2 vUv; varying float vN; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); w.xyz = lensWorld(w.xyz); gl_Position = projectionMatrix * viewMatrix * w; vN = 0.1 + 0.9 * smoothstep(14.0, 32.0, gl_Position.w); }`,
    fragmentShader: `uniform sampler2D tMap; uniform float uReveal, uDim; varying vec2 vUv; varying float vN;
      void main(){ float a = texture2D(tMap, vUv).a * smoothstep(fract(vUv.x / 3.0) - 0.02, fract(vUv.x / 3.0), uReveal);
        if (a < 0.01) discard; gl_FragColor = vec4(vec3(0.92, 0.86, 0.74) * 0.75 * uDim * vN, a); }`,
  });
  return { mesh: mesh(g, material), material, texture: tex };
}

function hands(U, group) {
  const out = {};
  const straight = (r0, r1, y, n = 40) => Array.from({ length: n + 1 }, (_, i) => new Vector3(0, y, -(r0 + ((r1 - r0) * i) / n)));
  const circle = (cz, rad, y, n = 48) => Array.from({ length: n + 1 }, (_, i) => new Vector3(Math.cos((i / n) * TAU) * rad, y, -cz + Math.sin((i / n) * TAU) * rad));
  const none = () => 0;
  const make = (name, y, color, fanK, r0, r1, build) => {
    const L = new Lines();
    build(L, y);
    const material = lineMaterial(U, { uSweepK: { value: 0 } });
    group.add(mesh(L.geometry(), material));
    // a faint swept sector behind each hand once the outside clock races
    const FN = 14, FS = 64, P = [], I = [];
    for (let j = 0; j <= FS; j++) for (let i = 0; i <= FN; i++) P.push(i / FN, j / FS, 0);
    for (let j = 0; j < FS; j++) for (let i = 0; i < FN; i++) { const q = j * (FN + 1) + i; I.push(q, q + 1, q + FN + 2, q, q + FN + 2, q + FN + 1); }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(P, 3)); g.setIndex(I);
    const fan = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
      uniforms: { uCamPos: U.camPos, uLens: U.lens, uR0: { value: r0 }, uR1: { value: r1 }, uAng: { value: 0 }, uSweep: { value: 0 }, uStr: { value: 0 }, uY: { value: y }, uCol: { value: new Vector3(...color).multiplyScalar(fanK) } },
      vertexShader: `${LENS} uniform float uR0, uR1, uAng, uSweep, uY; varying vec2 vP;
        void main(){ vP = position.xy; float r = mix(uR0, uR1, position.x); float a = uAng - position.y * uSweep;
          vec4 w = modelMatrix * vec4(sin(a) * r, uY, -cos(a) * r, 1.0); w.xyz = lensWorld(w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uStr; uniform vec3 uCol; varying vec2 vP;
        void main(){ float a = pow(1.0 - vP.y, 2.4) * uStr * smoothstep(0.0, 0.12, vP.x) * (0.5 + 0.5 * vP.x); gl_FragColor = vec4(uCol, a); }`,
    });
    group.add(mesh(g, fan));
    out[name] = { material, fan };
  };
  // hour hand: a broad blade with a Breguet moon near the tip
  make('h', 0.06, GOLD, 0.5, 4.4, 12.9, (L, y) => {
    L.poly(straight(4.4, 10.1, y), t => lerp(0.42, 0.18, t), () => col4(GOLD, 1.0), none, none);
    L.poly(circle(10.75, 0.62, y), () => 0.09, () => col4(GOLD, 1.3), none, none);
    L.poly(straight(11.37, 12.9, y, 8), t => lerp(0.18, 0.02, t), () => col4(GOLD, 1.1), none, none);
  });
  make('m', 0.14, GOLD, 0.45, 4.4, 17.9, (L, y) => {
    L.poly(straight(4.4, 15.2, y), t => lerp(0.28, 0.09, t), () => col4(GOLD, 0.95), none, none);
    L.poly(circle(15.62, 0.4, y), () => 0.06, () => col4(GOLD, 1.2), none, none);
    L.poly(straight(16.02, 17.9, y, 10), t => lerp(0.1, 0.015, t), () => col4(GOLD, 1.0), none, none);
  });
  // the second hand runs straight across the hole and bends around it
  make('s', 0.22, RED, 0.6, 4.4, 20.6, (L, y) => {
    L.poly(straight(-7.2, 20.6, y, 120), t => lerp(0.06, 0.022, t), () => col4(RED, 2.2), none, none);
    L.poly(circle(-6.0, 0.55, y), () => 0.06, () => col4(RED, 2.2), none, none);
  });
  return out;
}

export function createClock(U, { inscriptionText }) {
  const group = new Group();
  group.rotation.set(0.44, 0, -0.14, 'XYZ');
  group.scale.setScalar(0.8);
  const lines = dialLines(U), nums = numerals(U), band = inscription(U, inscriptionText);
  group.add(lines.mesh, nums.mesh, band.mesh);
  const hand = hands(U, group);
  return {
    group, hands: hand,
    /** angles in radians, clockwise from XII; angV in rad/s for the motion fans */
    update({ sec, min, hour, angV, reveal, dim, heat, racing }) {
      for (const [name, a, w] of [['s', sec, angV], ['m', min, angV / 60], ['h', hour, angV / 720]]) {
        const { material, fan } = hand[name];
        material.uniforms.uRot.value = a;
        material.uniforms.uDim.value = dim * Math.min(1, Math.max(0, (reveal - 0.55) / 0.3));
        const sweep = Math.min(w * 0.12, TAU * 0.98);
        fan.uniforms.uAng.value = a; fan.uniforms.uSweep.value = sweep;
        const s = Math.min(1, Math.max(0, (sweep - 0.05) / 1.15));
        fan.uniforms.uStr.value = (s * s * (3 - 2 * s) * 0.35 * dim * (name === 's' ? 1 : 1.4)) / Math.max(1, sweep * 0.6);
      }
      const handAngle = ((sec % TAU) + TAU) % TAU;
      lines.material.uniforms.uHand.value = handAngle;
      lines.material.uniforms.uReveal.value = reveal;
      lines.material.uniforms.uDim.value = dim * (0.85 + 0.15 * heat);
      lines.material.uniforms.uSweepK.value = racing ? 0.3 : 1;
      nums.material.uniforms.uHand.value = handAngle;
      nums.material.uniforms.uReveal.value = reveal;
      nums.material.uniforms.uDim.value = dim;
      band.material.uniforms.uReveal.value = reveal;
      band.material.uniforms.uDim.value = dim;
    },
    setInscription(text) {
      const next = inscription(U, text);
      group.remove(band.mesh); band.mesh.geometry.dispose(); band.material.dispose(); band.texture.dispose();
      Object.assign(band, next); group.add(band.mesh);
    },
  };
}
