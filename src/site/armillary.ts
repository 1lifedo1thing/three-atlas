import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, LineSegments, Mesh, ShaderMaterial, SphereGeometry } from 'three'

/** The hero's centrepiece: an armillary sphere drawn in hairlines. */
export function createArmillary() {
  const group = new Group()
  const spin = new Group()
  group.add(spin)
  const mats: ShaderMaterial[] = []
  const mat = (color: string, opacity: number) => {
    const m = new ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
      uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uFade: { value: 1 }, uCenterZ: { value: -10 }, uRadius: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uCenterZ; uniform float uRadius; varying float vDepth;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = (mv.z - uCenterZ) / uRadius; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity; uniform float uFade; varying float vDepth;
        void main() { gl_FragColor = vec4(uColor, uOpacity * uFade * (0.18 + 0.82 * smoothstep(-1.0, 0.8, vDepth))); }`,
    })
    mats.push(m)
    return m
  }
  const ring = (r: number, ticks: number, tick: number, every = 1) => {
    const p: number[] = []
    const n = 256
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2
      p.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0)
    }
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2, len = i % every === 0 ? tick * 2.2 : tick
      p.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * (r + len), Math.sin(a) * (r + len), 0)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(p, 3))
    return g
  }
  const paper = '#ece6da'
  const add = (g: BufferGeometry, m: ShaderMaterial, rx = 0, ry = 0, rz = 0, parent: Group = spin) => {
    const l = new LineSegments(g, m); l.rotation.set(rx, ry, rz); parent.add(l); return l
  }
  // Fixed outer meridian with degree ticks, and the horizon.
  add(ring(1.08, 72, 0.025, 9), mat(paper, 0.55), 0, 0, 0, group)
  add(ring(1.08, 0, 0), mat(paper, 0.22), Math.PI / 2, 0, 0, group)
  // Rotating sphere: equator, meridians, ecliptic.
  add(ring(1, 120, 0.018, 10), mat(paper, 0.6), Math.PI / 2)
  for (let i = 0; i < 4; i++) add(ring(1, 0, 0), mat(paper, 0.16), 0, (i / 4) * Math.PI)
  for (const lat of [-60, -30, 30, 60]) {
    const r = Math.cos((lat * Math.PI) / 180)
    const l = add(ring(r, 0, 0), mat(paper, 0.1), Math.PI / 2)
    l.position.y = Math.sin((lat * Math.PI) / 180)
  }
  const ecliptic = new Group()
  ecliptic.rotation.z = (23.4 * Math.PI) / 180
  spin.add(ecliptic)
  add(ring(1.0, 24, 0.04), mat('#ff5b37', 0.9), Math.PI / 2, 0, 0, ecliptic)
  // A small world travelling the ecliptic.
  const planet = new Mesh(new SphereGeometry(0.035, 16, 12), new ShaderMaterial({
    transparent: true, depthTest: false, uniforms: { uFade: { value: 1 } },
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uFade; void main(){ gl_FragColor = vec4(1.0, 0.36, 0.22, uFade); }',
  }))
  ecliptic.add(planet)
  // Axis.
  const axis = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, -1.32, 0, 0, 1.32, 0], 3))
  add(axis, mat(paper, 0.35), 0, 0, 0, group)
  group.rotation.set(0.32, -0.5, 0.12)

  return {
    group,
    update(time: number, fade: number, mx: number, my: number, viewZ: number, radius: number) {
      spin.rotation.y = time * 0.08
      const a = time * 0.35
      planet.position.set(Math.cos(a), 0, Math.sin(a))
      group.rotation.x = 0.32 + my * 0.12
      group.rotation.y = -0.5 + mx * 0.18
      for (const m of mats) { m.uniforms.uFade.value = fade; m.uniforms.uCenterZ.value = viewZ; m.uniforms.uRadius.value = radius }
      ;(planet.material as ShaderMaterial).uniforms.uFade.value = fade
      group.visible = fade > 0.002
    },
  }
}
