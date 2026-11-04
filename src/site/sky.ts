import {
  AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, LineSegments, Points, ShaderMaterial, Vector3,
} from 'three'

const R = 70
const toVec = (az: number, el: number, r = R) => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180
  return new Vector3(Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.cos(a) * Math.cos(e) * r)
}

const lineMat = (color: string, opacity: number) => new ShaderMaterial({
  transparent: true, depthWrite: false, blending: AdditiveBlending,
  uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uFade: { value: 1 } },
  vertexShader: /* glsl */ `
    varying float vFade;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFade = smoothstep(-0.2, 0.9, -normalize(mv.xyz).z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor; uniform float uOpacity; uniform float uFade;
    varying float vFade;
    void main() { gl_FragColor = vec4(uColor, uOpacity * uFade * (0.35 + 0.65 * vFade)); }`,
})

/** The celestial chart behind every view: graticule, ecliptic and a field of stars. */
export function createSky() {
  const group = new Group()
  const grid: number[] = []
  const push = (a: Vector3, b: Vector3) => grid.push(a.x, a.y, a.z, b.x, b.y, b.z)
  const step = 2
  for (let az = 0; az < 360; az += 15)
    for (let el = -75; el < 75; el += step) push(toVec(az, el), toVec(az, el + step))
  for (let el = -75; el <= 75; el += 15)
    for (let az = 0; az < 360; az += step) push(toVec(az, el), toVec(az + step, el))
  const gridGeo = new BufferGeometry()
  gridGeo.setAttribute('position', new Float32BufferAttribute(grid, 3))
  const gridMat = lineMat('#ece6da', 0.075)
  group.add(new LineSegments(gridGeo, gridMat))

  // Ecliptic: a great circle tilted 23.4°.
  const ecl: number[] = []
  const tilt = (23.4 * Math.PI) / 180
  for (let i = 0; i < 360; i += 1) {
    const p = (d: number) => {
      const a = (d * Math.PI) / 180
      const v = new Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)
      return v.applyAxisAngle(new Vector3(0, 0, 1), tilt)
    }
    const a = p(i), b = p(i + 1)
    if (i % 4 < 2) ecl.push(a.x, a.y, a.z, b.x, b.y, b.z)
  }
  const eclGeo = new BufferGeometry()
  eclGeo.setAttribute('position', new Float32BufferAttribute(ecl, 3))
  const eclMat = lineMat('#ff5b37', 0.32)
  group.add(new LineSegments(eclGeo, eclMat))

  // Stars.
  const n = 2600
  const pos = new Float32Array(n * 3), mag = new Float32Array(n), seed = new Float32Array(n)
  let s = 7
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1, th = rand() * Math.PI * 2, rr = Math.sqrt(1 - u * u)
    const r = R * 0.98
    pos.set([rr * Math.cos(th) * r, u * r, rr * Math.sin(th) * r], i * 3)
    mag[i] = Math.pow(rand(), 6)
    seed[i] = rand() * 100
  }
  const starGeo = new BufferGeometry()
  starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  starGeo.setAttribute('aMag', new Float32BufferAttribute(mag, 1))
  starGeo.setAttribute('aSeed', new Float32BufferAttribute(seed, 1))
  const starMat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aMag; attribute float aSeed;
      uniform float uTime; uniform float uPx;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.75 + 0.25 * sin(uTime * (0.6 + fract(aSeed) * 1.6) + aSeed);
        vA = (0.18 + aMag * 0.9) * tw;
        gl_PointSize = (1.0 + aMag * 2.6) * uPx;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFade; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(0.93, 0.9, 0.85), a * vA * uFade);
      }`,
  })
  group.add(new Points(starGeo, starMat))

  return {
    group,
    /** 0 = barely there (index), 1 = full chart (atlas). */
    setPresence(p: number) {
      gridMat.uniforms.uFade.value = 0.55 + p * 0.85
      eclMat.uniforms.uFade.value = 0.12 + p * 0.88
      starMat.uniforms.uFade.value = 0.6 + p * 0.4
    },
    update(time: number, pixelRatio: number) {
      starMat.uniforms.uTime.value = time
      starMat.uniforms.uPx.value = pixelRatio
    },
  }
}
